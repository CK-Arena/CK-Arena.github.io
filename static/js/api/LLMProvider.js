class LLMProvider {
  constructor(apiKey, providerName = 'Generic') {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
    this.providerName = providerName;
  }

  async chat(model, systemPrompt, userPrompt, options = {}) {
    throw new Error('chat() method must be implemented by subclass');
  }

  async testConnection() {
    throw new Error('testConnection() method must be implemented by subclass');
  }

  getAvailableModels() {
    throw new Error('getAvailableModels() method must be implemented by subclass');
  }

  getName() {
    return this.providerName;
  }

  parseJSONResponse(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return JSON.parse(text);
    } catch (error) {
      console.error('Failed to parse JSON response:', text);
      throw new Error(`Invalid JSON response: ${error.message}`);
    }
  }

  async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;

        if (error.message.includes('rate limit')) {
          const delay = baseDelay * Math.pow(2, i);
          console.warn(`Rate limit hit, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LLMProvider;
}
