import { RulesRegistry } from '../rules/rules-registry';
import { ProfileStorage } from '../storage/profile-storage';
import { AIClient } from '../ai/ai-client';
import type { ProjectHandle } from '../compiler/api/compiler-api';
export type { ProjectHandle };
export interface EngineConfig {
    enableAI: boolean;
    aiProvider: string;
    aiApiKey: string | null;
    performanceProfilePath: string;
}
export interface EngineContext {
    config: EngineConfig;
    rules: RulesRegistry;
    storage: ProfileStorage;
    aiClient: AIClient | null;
}
export interface EngineReport {
    analysis: any;
    security: any;
    performance: any;
    evolution: string[];
}
export declare class EngineMain {
    static init_engine(config: EngineConfig): EngineContext;
    static analyze_project(ctx: EngineContext, project: ProjectHandle): EngineReport;
}
