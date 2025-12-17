export interface AIAnalysis {
    suggestions: string[];
    improvements: string[];
    insights: string[];
}
export declare class AIAnalyzer {
    analyze(summary: string): Promise<AIAnalysis>;
    private delay;
}
