class AnthropicAdapter extends LLMProvider {
  constructor(apiKey) {
    super(apiKey, 'Anthropic');
    this.endpoint = 'https://api.anthropic.com/v1/messages';
    this.models = {
      'Claude-3-Opus': 'claude-3-opus-20240229',
      'Claude-3-Sonnet': 'claude-3-sonnet-20240229',
      'Claude-3-Haiku': 'claude-3-haiku-20240307',
      'Claude-3.5-Sonnet': 'claude-3-5-sonnet-20241022'
    };
    this.apiVersion = '2023-06-01';
  }

  async chat(model, systemPrompt, userPrompt, options = {}) {
    const requestBody = {
      model: this.models[model] || model,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature || 0.7,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt }
      ]
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error('rate limit exceeded');
        }
        if (response.status === 0 || response.type === 'opaque') {
          throw new Error('CORS error: Anthropic API may not support direct browser access. Please use a proxy or backend server.');
        }
        throw new Error(`Anthropic API error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      if (options.jsonMode) {
        return this.parseJSONResponse(content);
      }

      return content;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('CORS error: Anthropic API may not support direct browser access. Please use a proxy or backend server.');
      }
      console.error('Anthropic API call failed:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.chat('Claude-3-Haiku', 'You are a helpful assistant.', 'Say "test" if you can hear me.', { maxTokens: 10 });
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  getAvailableModels() {
    return Object.keys(this.models);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnthropicAdapter;
}
