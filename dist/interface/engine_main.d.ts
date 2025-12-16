import { RulesRegistry } from '../rules/rules_registry';
import { AnalysisResult } from '../analysis/analysis';
import { SecurityReport } from '../security/security';
import { PerfHints } from '../tester/tester';
import { EvolutionSuggestions } from '../evolver/evolver';
import { StorageHandle } from '../storage/profile_storage';
import { AIClient } from '../ai/ai_client';
export interface EngineConfig {
    enableAI: boolean;
    aiProvider: string;
    aiApiKey?: string;
    performanceProfilePath: string;
}
export interface EngineContext {
    config: EngineConfig;
    rules: RulesRegistry;
    storage: StorageHandle;
    aiClient: AIClient | null;
}
export interface ProjectHandle {
    root: string;
    loadAllAST: () => any[];
    isBenchmarkEnabled: () => boolean;
    discoverBenchmarks: () => any[];
}
export interface EngineReport {
    analysis: AnalysisResult;
    security: SecurityReport;
    performance: PerfHints;
    evolution: EvolutionSuggestions;
}
export declare function initEngine(config: EngineConfig): EngineContext;
export declare function analyzeProject(ctx: EngineContext, project: ProjectHandle): EngineReport;
