export type BenchmarkResult = {
    name: string;
    executionTime: number;
    memoryUsage: number;
    iterations: number;
    opsPerSecond: number;
    timestamp: Date;
};
export type PerformanceProfile = {
    code: string;
    target: 'wasm' | 'native' | 'js';
    results: BenchmarkResult[];
    averageTime: number;
    medianTime: number;
    p95Time: number;
    p99Time: number;
};
export declare class PerformanceTester {
    private profiles;
    benchmark(code: string, name: string, iterations?: number): Promise<BenchmarkResult>;
    profileCode(code: string, target?: 'wasm' | 'native' | 'js'): Promise<PerformanceProfile>;
    compareTargets(code: string): Promise<{
        js: PerformanceProfile;
        wasm: PerformanceProfile;
        comparison: {
            faster: string;
            speedup: number;
        };
    }>;
    private executeCode;
    private getMemoryUsage;
    getProfiles(): PerformanceProfile[];
}
export declare const performanceTester: PerformanceTester;
