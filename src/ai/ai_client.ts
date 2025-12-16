export interface AIClient {
  provider: string
  apiKey: string
}

export interface AIRequest {
  kind: string
  payload: Record<string, any>
}

export interface AIResponse {
  success: boolean
  suggestions: string[]
}

export function initAIClient(provider: string, apiKey: string): AIClient | null {
  if (!apiKey) return null
  
  console.log(`[AI] Initializing ${provider} client`)
  
  return {
    provider,
    apiKey
  }
}

export async function suggestImprovements(client: AIClient, request: AIRequest): Promise<AIResponse> {
  console.log(`[AI] Requesting suggestions for ${request.kind}`)
  
  try {
    // Call the generate-proposal API
    const response = await fetch('/api/generate-proposal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context: JSON.stringify(request.payload),
        model: process.env.OLLAMA_MODEL || 'openai/gpt-4o-mini'
      })
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    const data = await response.json() as any
    
    return {
      success: true,
      suggestions: data.suggestions || []
    }
  } catch (error) {
    console.error('[AI] Failed to get suggestions:', error)
    return {
      success: false,
      suggestions: []
    }
  }
}
