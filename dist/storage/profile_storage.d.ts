import { AnalysisResult } from '../analysis/analysis';
import { SecurityReport } from '../security/security';
import { PerfHints } from '../tester/tester';
import { EvolutionSuggestions } from '../evolver/evolver';
import { ProjectHandle } from '../interface/engine_main';
export interface StorageHandle {
    path: string;
    data: Map<string, any>;
}
export interface StoredReport {
    timestamp: number;
    projectRoot: string;
    analysis: AnalysisResult;
    security: SecurityReport;
    performance: PerfHints;
    evolution: EvolutionSuggestions;
}
export declare function openStorage(path: string): StorageHandle;
export declare function saveReport(storage: StorageHandle, project: ProjectHandle, analysis: AnalysisResult, security: SecurityReport, perf: PerfHints, evolution: EvolutionSuggestions): void;
export declare function loadReports(storage: StorageHandle, projectRoot: string): StoredReport[];
export declare function getLatestReport(storage: StorageHandle, projectRoot: string): StoredReport | null;
