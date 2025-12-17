export type AnalysisIssue = {
    id: string;
    type: 'error' | 'warning' | 'info' | 'suggestion';
    category: 'safety' | 'performance' | 'style' | 'logic' | 'structure';
    message: string;
    location: {
        line: number;
        column: number;
    };
    severity: number;
    fix?: string;
};
export declare class StaticAnalyzer {
    private parser;
    constructor();
    analyze(code: string): AnalysisIssue[];
    private analyzeDeadCode;
    private analyzeComplexity;
    private analyzeSafety;
    private analyzePerformance;
    private analyzeStructure;
    private traverseAST;
}
export declare const staticAnalyzer: StaticAnalyzer;
