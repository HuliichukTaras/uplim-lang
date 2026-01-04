import { AIClient, AIResponse } from './ai_client';
export type OpenAIModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | string;
export interface OpenAIConfig {
    apiKey: string;
    baseUrl: string;
    model: OpenAIModel;
    maxTokens: number;
}
export interface OpenAIClient extends AIClient {
    config: OpenAIConfig;
}
export declare function initOpenAI(config: OpenAIConfig): OpenAIClient;
export declare function callCompletion(client: OpenAIClient, prompt: string): Promise<AIResponse>;
