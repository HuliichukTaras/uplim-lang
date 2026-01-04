export type AIProvider = 'openai' | 'anthropic' | 'local';
export type AIAnalysisRequest = {
    code: string;
    context: string;
    task: 'optimize' | 'fix' | 'refactor' | 'explain' | 'suggest';
    ideology: Record<string, any>;
};
export type AIAnalysisResponse = {
    suggestions: string[];
    improvements: string[];
    risks: string[];
    confidence: number;
};
export declare class LLMIntegration {
    private provider;
    private apiKey?;
    constructor(provider?: AIProvider);
    analyze(request: AIAnalysisRequest): Promise<AIAnalysisResponse>;
    generateOptimization(code: string): Promise<string>;
    detectPatterns(codebase: string[]): Promise<string[]>;
    isConfigured(): boolean;
}
export declare const llmIntegration: LLMIntegration;
