class GameEngine {
  constructor(config, eventCallback) {
    this.config = config;
    this.eventCallback = eventCallback || (() => {});
    this.players = [];
    this.judges = [];
    this.gameState = {
      currentRound: 0,
      currentPhase: 'setup',
      statements: [],
      votes: [],
      eliminated: [],
      gameOver: false,
      winner: null
    };
    this.maxRounds = config.maxRounds || 10;
    this.eliminationThreshold = config.eliminationThreshold || 0.5;
    this.conceptPair = config.conceptPair;
  }

  setupGame() {
    const totalPlayers = this.config.playerCount;
    const undercoverCount = this.config.undercoverCount;

    const playerIds = Array.from({ length: totalPlayers }, (_, i) => i + 1);

    for (let i = playerIds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [playerIds[i], playerIds[j]] = [playerIds[j], playerIds[i]];
    }

    const undercoverIds = playerIds.slice(0, undercoverCount);

    this.config.playerConfigs.forEach((playerConfig, index) => {
      const playerId = index + 1;
      const role = undercoverIds.includes(playerId) ? 'undercover' : 'civilian';
      const concept = role === 'undercover' ? this.conceptPair.conceptB : this.conceptPair.conceptA;

      const player = new Player(
        playerId,
        playerConfig.provider,
        playerConfig.model,
        role,
        concept,
        this.config.language
      );

      this.players.push(player);
    });

    this.config.judgeConfigs.forEach((judgeConfig, index) => {
      const judge = new Judge(
        `judge_${index + 1}`,
        judgeConfig.provider,
        judgeConfig.model,
        this.config.language
      );
      this.judges.push(judge);
    });

    this.emit('gameSetup', {
      players: this.players.map(p => p.toJSON()),
      judges: this.judges.map(j => j.toJSON()),
      conceptPair: this.conceptPair
    });
  }

  async runGame() {
    console.log('GameEngine: Setting up game...');
    this.setupGame();
    console.log('GameEngine: Setup complete, starting game loop...');
    this.gameState.currentPhase = 'playing';
    this.emit('gameStart', {});

    while (!this.gameState.gameOver && this.gameState.currentRound < this.maxRounds) {
      this.gameState.currentRound++;
      console.log(`GameEngine: Starting round ${this.gameState.currentRound}`);

      await this.conductStatementRound();

      if (this.gameState.currentRound % this.config.roundsBeforeVoting === 0) {
        console.log('GameEngine: Conducting voting round...');
        await this.conductVotingRound();
      }

      const winCheck = this.checkWinConditions();
      if (winCheck.gameOver) {
        console.log('GameEngine: Game over -', winCheck.winner, winCheck.reason);
        this.endGame(winCheck.winner, winCheck.reason);
        break;
      }
    }

    if (!this.gameState.gameOver) {
      console.log('GameEngine: Maximum rounds reached');
      this.endGame('draw', 'Maximum rounds reached');
    }

    console.log('GameEngine: Game finished');
    return this.getGameResult();
  }

  async conductStatementRound() {
    console.log(`GameEngine: Round ${this.gameState.currentRound} - Starting statement round`);
    this.emit('roundStart', { round: this.gameState.currentRound, phase: 'statements' });

    const alivePlayers = this.players.filter(p => !p.isEliminated);
    const alivePlayerIds = alivePlayers.map(p => p.playerId);
    console.log(`GameEngine: ${alivePlayers.length} alive players:`, alivePlayerIds);

    for (const player of alivePlayers) {
      console.log(`GameEngine: Player ${player.playerId} turn (${player.model})`);
      this.emit('playerTurn', { playerId: player.playerId });

      try {
        const statementHistory = this.formatStatementHistory();
        console.log(`GameEngine: Requesting statement from player ${player.playerId}...`);
        const result = await player.generateStatement(statementHistory, alivePlayerIds);
        console.log(`GameEngine: Player ${player.playerId} generated statement:`, result.statement);

        const statementData = {
          round: this.gameState.currentRound,
          playerId: player.playerId,
          statement: result.statement,
          identity: result.identity,
          strategy: result.strategy,
          scores: null
        };

        this.gameState.statements.push(statementData);

        this.emit('statementGenerated', statementData);

        if (this.judges.length > 0) {
          const scores = await this.evaluateStatement(player, result.statement);
          statementData.scores = scores;

          this.emit('statementEvaluated', { playerId: player.playerId, scores });

          if (scores.average < this.eliminationThreshold) {
            player.eliminate(this.gameState.currentRound);
            this.gameState.eliminated.push({
              playerId: player.playerId,
              round: this.gameState.currentRound,
              reason: 'Low score',
              role: player.role
            });
            this.emit('playerEliminated', {
              playerId: player.playerId,
              reason: 'Low score',
              role: player.role
            });
          }
        }
      } catch (error) {
        console.error(`Error in player ${player.playerId} statement:`, error);
        this.emit('error', {
          type: 'statement',
          playerId: player.playerId,
          error: error.message
        });
      }
    }

    this.emit('roundEnd', { round: this.gameState.currentRound, phase: 'statements' });
  }

  async evaluateStatement(player, statement) {
    const otherConcept = player.role === 'undercover' ? this.conceptPair.conceptA : this.conceptPair.conceptB;
    const history = this.formatStatementHistory();

    const judgeEvaluations = [];

    for (const judge of this.judges) {
      try {
        const evaluation = await judge.evaluateStatement(
          player.assignedConcept,
          otherConcept,
          statement,
          history
        );
        judgeEvaluations.push(evaluation);
      } catch (error) {
        console.error(`Judge ${judge.judgeId} evaluation failed:`, error);
      }
    }

    const avgScores = {
      novelty: 0,
      relevance: 0,
      reasonableness: 0
    };

    if (judgeEvaluations.length > 0) {
      judgeEvaluations.forEach(eval => {
        avgScores.novelty += eval.scores.novelty;
        avgScores.relevance += eval.scores.relevance;
        avgScores.reasonableness += eval.scores.reasonableness;
      });

      avgScores.novelty /= judgeEvaluations.length;
      avgScores.relevance /= judgeEvaluations.length;
      avgScores.reasonableness /= judgeEvaluations.length;
    }

    avgScores.average = (avgScores.novelty + avgScores.relevance + avgScores.reasonableness) / 3;

    return {
      judgeEvaluations,
      avgScores
    };
  }

  async conductVotingRound() {
    this.emit('roundStart', { round: this.gameState.currentRound, phase: 'voting' });

    const alivePlayers = this.players.filter(p => !p.isEliminated);
    const alivePlayerIds = alivePlayers.map(p => p.playerId);
    const votes = {};

    for (const player of alivePlayers) {
      try {
        const statementHistory = this.formatStatementHistory();
        const result = await player.generateVote(statementHistory, alivePlayerIds);

        votes[player.playerId] = result.vote;

        this.emit('voteGenerated', {
          voterId: player.playerId,
          votedFor: result.vote
        });
      } catch (error) {
        console.error(`Error in player ${player.playerId} vote:`, error);
        const validTargets = alivePlayerIds.filter(id => id !== player.playerId);
        votes[player.playerId] = validTargets[Math.floor(Math.random() * validTargets.length)];
      }
    }

    const voteCounts = {};
    alivePlayerIds.forEach(id => voteCounts[id] = 0);
    Object.values(votes).forEach(votedFor => {
      if (voteCounts[votedFor] !== undefined) {
        voteCounts[votedFor]++;
      }
    });

    const maxVotes = Math.max(...Object.values(voteCounts));
    const eliminatedPlayerId = parseInt(Object.keys(voteCounts).find(id => voteCounts[id] === maxVotes));

    const eliminatedPlayer = this.players.find(p => p.playerId === eliminatedPlayerId);
    if (eliminatedPlayer) {
      eliminatedPlayer.eliminate(this.gameState.currentRound);
      this.gameState.eliminated.push({
        playerId: eliminatedPlayerId,
        round: this.gameState.currentRound,
        reason: 'Voted out',
        role: eliminatedPlayer.role,
        votes: voteCounts[eliminatedPlayerId]
      });

      this.emit('playerEliminated', {
        playerId: eliminatedPlayerId,
        reason: 'Voted out',
        role: eliminatedPlayer.role,
        votes: voteCounts
      });
    }

    this.gameState.votes.push({
      round: this.gameState.currentRound,
      votes: votes,
      voteCounts: voteCounts,
      eliminated: eliminatedPlayerId
    });

    this.emit('roundEnd', { round: this.gameState.currentRound, phase: 'voting' });
  }

  checkWinConditions() {
    const alivePlayers = this.players.filter(p => !p.isEliminated);
    const aliveCivilians = alivePlayers.filter(p => p.role === 'civilian').length;
    const aliveUndercover = alivePlayers.filter(p => p.role === 'undercover').length;

    if (aliveUndercover === 0) {
      return { gameOver: true, winner: 'civilians', reason: 'All undercover agents eliminated' };
    }

    if (aliveUndercover >= aliveCivilians) {
      return { gameOver: true, winner: 'undercover', reason: 'Undercover equals or outnumbers civilians' };
    }

    return { gameOver: false };
  }

  endGame(winner, reason) {
    this.gameState.gameOver = true;
    this.gameState.winner = winner;
    this.gameState.currentPhase = 'finished';

    this.emit('gameEnd', {
      winner: winner,
      reason: reason,
      finalState: this.getGameResult()
    });
  }

  formatStatementHistory() {
    return this.gameState.statements
      .map(s => `Player ${s.playerId}: "${s.statement}"`)
      .join('\n');
  }

  getGameResult() {
    return {
      config: {
        playerCount: this.config.playerCount,
        undercoverCount: this.config.undercoverCount,
        conceptPair: this.conceptPair,
        language: this.config.language
      },
      players: this.players.map(p => p.toJSON()),
      statements: this.gameState.statements,
      votes: this.gameState.votes,
      eliminated: this.gameState.eliminated,
      winner: this.gameState.winner,
      totalRounds: this.gameState.currentRound
    };
  }

  emit(eventType, data) {
    this.eventCallback(eventType, data);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
