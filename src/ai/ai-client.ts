export interface AIClient {
  provider: string;
  apiKey: string;
}

export interface AIRequest {
  kind: string;
  payload: Record<string, any>;
}

export interface AIResponse {
  success: boolean;
  suggestions: string[];
}

export function initAIClient(provider: string, apiKey: string | null): AIClient | null {
  if (!apiKey) return null;
  return { provider, apiKey };
}

export async function suggest_improvements(client: AIClient, request: AIRequest): Promise<AIResponse> {
  // Route to provider-specific implementation
  if (client.provider === 'openai') {
    const { callOpenAICompletion } = await import('./ai-openai');
    return callOpenAICompletion(client, request);
  }
  
  return { success: false, suggestions: [] };
}
