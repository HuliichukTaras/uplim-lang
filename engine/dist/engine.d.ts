import { Diagnostic, CodeMetrics } from './analysis';
import { SecurityIssue } from './security';
import { AIAnalysis } from './ai';
export interface EngineReport {
    timestamp: string;
    projectPath: string;
    files: FileReport[];
    summary: Summary;
    aiAnalysis?: AIAnalysis;
}
export interface FileReport {
    path: string;
    diagnostics: Diagnostic[];
    security: SecurityIssue[];
    metrics: CodeMetrics;
}
export interface Summary {
    totalFiles: number;
    totalDiagnostics: number;
    errorCount: number;
    warningCount: number;
    securityScore: number;
    averageComplexity: number;
}
export declare class UPLimEngine {
    private parser;
    private analyzer;
    private securityAnalyzer;
    private aiAnalyzer;
    private storage;
    constructor(projectRoot: string);
    analyze(targetPath: string, options?: {
        ai?: boolean;
    }): Promise<EngineReport>;
    private analyzeFile;
    private findUPLimFiles;
    private generateSummary;
}
