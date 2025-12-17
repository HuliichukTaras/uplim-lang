import type { AIClient, AIRequest, AIResponse } from './ai-client';
export type OpenAIModel = "gpt-4o-mini" | "gpt-4o" | string;
export interface OpenAIConfig {
    apiKey: string;
    baseUrl: string;
    model: OpenAIModel;
    maxTokens: number;
}
export declare function callOpenAICompletion(client: AIClient, request: AIRequest): Promise<AIResponse>;
