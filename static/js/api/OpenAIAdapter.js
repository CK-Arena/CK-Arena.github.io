class OpenAIAdapter extends LLMProvider {
  constructor(apiKey) {
    super(apiKey, 'OpenAI');
    this.endpoint = 'https://api.openai.com/v1/chat/completions';
    this.models = {
      'GPT-4o': 'gpt-4o',
      'GPT-4o-mini': 'gpt-4o-mini',
      'GPT-4-turbo': 'gpt-4-turbo',
      'GPT-4': 'gpt-4',
      'GPT-3.5-turbo': 'gpt-3.5-turbo'
    };
  }

  async chat(model, systemPrompt, userPrompt, options = {}) {
    const requestBody = {
      model: this.models[model] || model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000
    };

    if (options.jsonMode) {
      requestBody.response_format = { type: 'json_object' };
    }

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          throw new Error('rate limit exceeded');
        }
        throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      if (options.jsonMode) {
        return this.parseJSONResponse(content);
      }

      return content;
    } catch (error) {
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('CORS error: OpenAI API does not support direct browser access. Please use a proxy or backend server, or try Google Gemini API instead.');
      }
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.chat('GPT-3.5-turbo', 'You are a helpful assistant.', 'Say "test" if you can hear me.', { maxTokens: 10 });
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
  module.exports = OpenAIAdapter;
}
