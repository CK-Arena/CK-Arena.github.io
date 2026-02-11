class Judge {
  constructor(judgeId, llmProvider, model, language = 'en') {
    this.judgeId = judgeId;
    this.llmProvider = llmProvider;
    this.model = model;
    this.language = language;
  }

  async evaluateStatement(playerConcept, otherConcept, statement, history) {
    const prompts = this.language === 'zh' ? JudgePromptsZH : JudgePromptsEN;

    const systemPrompt = prompts.systemJudge();
    const userPrompt = prompts.userJudge(playerConcept, otherConcept, statement, history);

    try {
      const response = await this.llmProvider.retryWithBackoff(async () => {
        return await this.llmProvider.chat(this.model, systemPrompt, userPrompt, {
          jsonMode: true,
          temperature: 0.3
        });
      });

      const scores = {
        novelty: this.parseScore(response.novelty),
        relevance: this.parseScore(response.relevance),
        reasonableness: this.parseScore(response.reasonableness)
      };

      return {
        judgeId: this.judgeId,
        scores: scores,
        explanations: {
          novelty: response.novelty?.explanation || '',
          relevance: response.relevance?.explanation || '',
          reasonableness: response.reasonableness?.explanation || ''
        }
      };
    } catch (error) {
      console.error(`Judge ${this.judgeId} failed to evaluate statement:`, error);

      return {
        judgeId: this.judgeId,
        scores: {
          novelty: 0.5,
          relevance: 0.5,
          reasonableness: 0.5
        },
        explanations: {
          novelty: 'Error in evaluation',
          relevance: 'Error in evaluation',
          reasonableness: 'Error in evaluation'
        },
        error: true
      };
    }
  }

  parseScore(scoreObj) {
    if (!scoreObj) return 0.5;

    const score = typeof scoreObj === 'number' ? scoreObj : parseFloat(scoreObj.score);

    if (isNaN(score) || score < 0 || score > 1) {
      console.warn(`Invalid score: ${score}, using 0.5`);
      return 0.5;
    }

    const validScores = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    let closest = validScores[0];
    let minDiff = Math.abs(score - closest);

    for (const validScore of validScores) {
      const diff = Math.abs(score - validScore);
      if (diff < minDiff) {
        minDiff = diff;
        closest = validScore;
      }
    }

    return closest;
  }

  toJSON() {
    return {
      judgeId: this.judgeId,
      model: this.model
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Judge;
}
