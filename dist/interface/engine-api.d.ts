export declare class UPLimEngineAPI {
    analyzeCode(code: string): Promise<{
        issues: import("../analysis/static-analyzer").AnalysisIssue[];
        security: import("../security/vulnerability-scanner").SecurityReport;
        syntaxCheck: {
            valid: boolean;
            violations: string[];
        };
        summary: {
            totalIssues: number;
            criticalIssues: number;
            securityThreats: number;
            riskScore: number;
            syntaxValid: boolean;
        };
    }>;
    benchmarkCode(code: string): Promise<import("../tester/performance-tester").BenchmarkResult>;
    profileCode(code: string, target?: 'wasm' | 'native' | 'js'): Promise<import("../tester/performance-tester").PerformanceProfile>;
    scanSecurity(code: string): import("../security/vulnerability-scanner").SecurityReport;
    getLSPServer(): import("../editor/lsp-server").LSPServer;
    generateProposals(context: string): Promise<import("../evolver/proposal-generator").EvolutionProposal[]>;
    analyzeWithAI(code: string, task: 'optimize' | 'fix' | 'refactor' | 'explain' | 'suggest'): Promise<import("../ai/llm-integration").AIAnalysisResponse>;
    getEngineStatus(): {
        version: string;
        modules: {
            analysis: boolean;
            performance: boolean;
            security: boolean;
            lsp: boolean;
            ai: boolean;
        };
        uptime: number;
    };
}
export declare const engineAPI: UPLimEngineAPI;
