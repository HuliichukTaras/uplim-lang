import type { AIClient, AIRequest, AIResponse } from './ai-client';

export type OpenAIModel = "gpt-4o-mini" | "gpt-4o" | string;

export interface OpenAIConfig {
  apiKey: string;
  baseUrl: string;
  model: OpenAIModel;
  maxTokens: number;
}

export async function callOpenAICompletion(client: AIClient, request: AIRequest): Promise<AIResponse> {
  const config: OpenAIConfig = {
    apiKey: client.apiKey,
    baseUrl: 'https://api.openai.com',
    model: 'gpt-4o-mini',
    maxTokens: 2000,
  };

  const prompt = buildPromptFromRequest(request);
  const sanitizedPrompt = sanitizePrompt(prompt);

  try {
    const response = await fetch(`${config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a UPLim language assistant. Provide concise improvement suggestions.' },
          { role: 'user', content: sanitizedPrompt },
        ],
        max_tokens: config.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const suggestions = parseSuggestions(data);

    return { success: true, suggestions };
  } catch (error) {
    console.error('[AI] OpenAI call failed:', error);
    return { success: false, suggestions: [] };
  }
}

function buildPromptFromRequest(request: AIRequest): string {
  const { kind, payload } = request;
  
  if (kind === 'language-evolution') {
    return `Analyze this UPLim language summary and suggest improvements:

Summary: ${payload.summary}

Constraints:
${payload.constraints?.join('\n')}

Provide 3-5 specific suggestions for language improvements.`;
  }

  return JSON.stringify(payload);
}

function sanitizePrompt(prompt: string): string {
  // Remove sensitive data, limit length
  return prompt.slice(0, 10000);
}

function parseSuggestions(data: any): string[] {
  const content = data.choices?.[0]?.message?.content || '';
  
  // Parse numbered list or bullet points
  const lines = content.split('\n').filter((line: string) => line.trim());
  const suggestions: string[] = [];

  for (const line of lines) {
    const match = line.match(/^[\d\-\*\.]+\s*(.+)$/);
    if (match) {
      suggestions.push(match[1].trim());
    }
  }

  return suggestions.length > 0 ? suggestions : [content];
}
