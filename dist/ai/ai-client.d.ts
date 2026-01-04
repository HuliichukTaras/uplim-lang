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
export declare function initAIClient(provider: string, apiKey: string | null): AIClient | null;
export declare function suggest_improvements(client: AIClient, request: AIRequest): Promise<AIResponse>;
