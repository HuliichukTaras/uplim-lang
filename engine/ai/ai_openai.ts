import { AIClient, AIRequest, AIResponse } from './ai_client'

export type OpenAIModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | string

export interface OpenAIConfig {
  apiKey: string
  baseUrl: string
  model: OpenAIModel
  maxTokens: number
}

export interface OpenAIClient extends AIClient {
  config: OpenAIConfig
}

function sanitizePrompt(prompt: string): string {
  // Remove potentially harmful content
  let cleaned = prompt.trim()
  
  // Ensure prompt is not too long
  if (cleaned.length > 10000) {
    cleaned = cleaned.substring(0, 10000) + '...'
  }
  
  return cleaned
}

function parseSuggestions(raw: any): string[] {
  try {
    const content = raw.choices?.[0]?.message?.content || ''
    
    // Try to parse as JSON array
    if (content.startsWith('[')) {
      return JSON.parse(content)
    }
    
    // Otherwise split by newlines
    return content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
  } catch (error) {
    console.error('[OpenAI] Failed to parse suggestions:', error)
    return []
  }
}

export function initOpenAI(config: OpenAIConfig): OpenAIClient {
  return {
    provider: 'openai',
    apiKey: config.apiKey,
    config
  }
}

export async function callCompletion(client: OpenAIClient, prompt: string): Promise<AIResponse> {
  const sanitizedPrompt = sanitizePrompt(prompt)

  try {
    const response = await fetch(client.config.baseUrl + '/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${client.config.apiKey}`
      },
      body: JSON.stringify({
        model: client.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a UPLim language assistant. Provide concise, actionable suggestions for language improvements.'
          },
          {
            role: 'user',
            content: sanitizedPrompt
          }
        ],
        max_tokens: client.config.maxTokens
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const raw = await response.json()
    const suggestions = parseSuggestions(raw)

    return {
      success: true,
      suggestions
    }
  } catch (error) {
    console.error('[OpenAI] API call failed:', error)
    return {
      success: false,
      suggestions: []
    }
  }
}
