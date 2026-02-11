class GoogleAdapter extends LLMProvider {
  constructor(apiKey) {
    super(apiKey, 'Google');
    this.baseEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.models = {
      'Gemini-Pro': 'gemini-pro',
      'Gemini-1.5-Pro': 'gemini-1.5-pro',
      'Gemini-1.5-Flash': 'gemini-1.5-flash'
    };
  }

  async chat(model, systemPrompt, userPrompt, options = {}) {
    const modelId = this.models[model] || model;
    const endpoint = `${this.baseEndpoint}/${modelId}:generateContent?key=${this.apiKey}`;

    console.log(`GoogleAdapter: Calling ${modelId} with jsonMode=${options.jsonMode}`);

    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: combinedPrompt }
          ]
        }
      ],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 1024,
        topP: 0.8,
        topK: 10
      }
    };

    if (options.jsonMode) {
      requestBody.generationConfig.responseMimeType = 'application/json';
    }

    try {
      console.log('GoogleAdapter: Sending request to Gemini API...');
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('GoogleAdapter: Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('GoogleAdapter: API error response:', errorData);
        if (response.status === 429) {
          throw new Error('rate limit exceeded');
        }
        throw new Error(`Google AI API error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('GoogleAdapter: Response data:', data);

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('GoogleAdapter: Invalid response structure:', data);
        throw new Error('Invalid response from Google AI API');
      }

      const content = data.candidates[0].content.parts[0].text;
      console.log('GoogleAdapter: Extracted content:', content.substring(0, 100) + '...');

      if (options.jsonMode) {
        const parsed = this.parseJSONResponse(content);
        console.log('GoogleAdapter: Parsed JSON:', parsed);
        return parsed;
      }

      return content;
    } catch (error) {
      console.error('GoogleAdapter: API call failed:', error);
      console.error('GoogleAdapter: Error stack:', error.stack);
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.chat('Gemini-Pro', 'You are a helpful assistant.', 'Say "test" if you can hear me.', { maxTokens: 10 });
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
  module.exports = GoogleAdapter;
}
