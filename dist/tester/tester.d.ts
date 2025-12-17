import { EngineContext, ProjectHandle } from '../interface/engine-main';
export interface PerfMetrics {
    functionName: string;
    avgTimeNs: number;
    maxTimeNs: number;
    memoryBytes: number;
}
export interface PerfHints {
    metrics: PerfMetrics[];
    suggestions: string[];
}
export declare function maybeBenchmark(ctx: EngineContext, project: ProjectHandle): PerfHints;
export declare class Tester {
    static benchmark(ctx: EngineContext, project: ProjectHandle): PerfHints;
}
