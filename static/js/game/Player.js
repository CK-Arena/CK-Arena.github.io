class Player {
  constructor(playerId, llmProvider, model, role, assignedConcept, language = 'en') {
    this.playerId = playerId;
    this.llmProvider = llmProvider;
    this.model = model;
    this.role = role;
    this.assignedConcept = assignedConcept;
    this.language = language;
    this.isEliminated = false;
    this.eliminatedInRound = null;
    this.lastAnalyze = 'This is the first round, no previous analysis.';
    this.statements = [];
    this.votes = [];
  }

  async generateStatement(statementHistory, alivePlayers) {
    console.log(`Player ${this.playerId}: Generating statement...`);
    const prompts = this.language === 'zh' ? PlayerPromptsZH : PlayerPromptsEN;

    const systemPrompt = prompts.systemSpeakPlayer();
    const userPrompt = prompts.userSpeakPlayer(
      this.playerId,
      this.assignedConcept,
      statementHistory,
      this.lastAnalyze,
      alivePlayers
    );

    console.log(`Player ${this.playerId}: Calling LLM API (${this.model})...`);
    try {
      const response = await this.llmProvider.retryWithBackoff(async () => {
        console.log(`Player ${this.playerId}: API call attempt...`);
        return await this.llmProvider.chat(this.model, systemPrompt, userPrompt, {
          jsonMode: true,
          temperature: 0.8
        });
      });

      console.log(`Player ${this.playerId}: Received response:`, response);

      if (!response.statement) {
        throw new Error('Response missing statement field');
      }

      this.lastAnalyze = response.identity || this.lastAnalyze;

      return {
        statement: response.statement,
        identity: response.identity,
        strategy: response.strategy
      };
    } catch (error) {
      console.error(`Player ${this.playerId} failed to generate statement:`, error);
      console.error(`Player ${this.playerId} error stack:`, error.stack);
      throw error;
    }
  }

  async generateVote(statementHistory, alivePlayers) {
    const prompts = this.language === 'zh' ? PlayerPromptsZH : PlayerPromptsEN;

    const systemPrompt = prompts.systemVotePlayer();
    const userPrompt = prompts.userVotePlayer(
      this.playerId,
      this.assignedConcept,
      statementHistory,
      this.lastAnalyze,
      alivePlayers
    );

    try {
      const response = await this.llmProvider.retryWithBackoff(async () => {
        return await this.llmProvider.chat(this.model, systemPrompt, userPrompt, {
          jsonMode: true,
          temperature: 0.8
        });
      });

      let voteTarget = parseInt(response.vote);

      if (isNaN(voteTarget) || !alivePlayers.includes(voteTarget)) {
        console.warn(`Player ${this.playerId} generated invalid vote: ${response.vote}, choosing random target`);
        const validTargets = alivePlayers.filter(p => p !== this.playerId);
        voteTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
      }

      this.lastAnalyze = response.identity || this.lastAnalyze;

      return {
        vote: voteTarget,
        identity: response.identity,
        strategy: response.strategy
      };
    } catch (error) {
      console.error(`Player ${this.playerId} failed to generate vote:`, error);
      const validTargets = alivePlayers.filter(p => p !== this.playerId);
      return {
        vote: validTargets[Math.floor(Math.random() * validTargets.length)],
        identity: 'Error generating vote',
        strategy: 'Random fallback vote'
      };
    }
  }

  eliminate(round) {
    this.isEliminated = true;
    this.eliminatedInRound = round;
  }

  toJSON() {
    return {
      playerId: this.playerId,
      model: this.model,
      role: this.role,
      assignedConcept: this.assignedConcept,
      isEliminated: this.isEliminated,
      eliminatedInRound: this.eliminatedInRound
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Player;
}
