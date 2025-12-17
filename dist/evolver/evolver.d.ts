import { EngineContext } from '../interface/engine-main';
import { AnalysisResult } from '../analysis/analysis';
import { SecurityReport } from '../security/security';
import { PerfHints } from '../tester/tester';
export interface EvolutionSuggestions {
    heuristic: string[];
    ai: string[];
    merged: string[];
}
export declare function proposeLanguageChanges(ctx: EngineContext, analysis: AnalysisResult, security: SecurityReport, perf: PerfHints): EvolutionSuggestions;
export declare class Evolver {
    static propose(ctx: EngineContext, analysis: AnalysisResult, security: SecurityReport, perf: PerfHints): EvolutionSuggestions;
}
