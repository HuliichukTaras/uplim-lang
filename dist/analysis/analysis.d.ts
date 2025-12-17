import { EngineContext, ProjectHandle } from '../interface/engine-main';
export interface Diagnostic {
    message: string;
    severity: 'info' | 'warning' | 'error';
    location: any;
    code: string;
}
export interface ProjectMetrics {
    totalLines: number;
    totalFunctions: number;
    averageComplexity: number;
    typesCoverage: number;
}
export interface AnalysisResult {
    diagnostics: Diagnostic[];
    metrics: ProjectMetrics;
}
export declare function runAnalysis(ctx: EngineContext, project: ProjectHandle): AnalysisResult;
export declare class Analysis {
    static run(ctx: EngineContext, project: ProjectHandle): AnalysisResult;
}
