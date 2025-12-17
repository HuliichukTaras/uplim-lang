"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tester = void 0;
exports.maybeBenchmark = maybeBenchmark;
function runBenchmark(bench) {
    const iterations = 1000;
    const times = [];
    let maxTime = 0;
    let memoryUsed = 0;
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        bench.run();
        const end = performance.now();
        const time = (end - start) * 1_000_000; // convert to nanoseconds
        times.push(time);
        if (time > maxTime)
            maxTime = time;
    }
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    return {
        functionName: bench.name,
        avgTimeNs: avgTime,
        maxTimeNs: maxTime,
        memoryBytes: memoryUsed
    };
}
function deriveSuggestionsFromMetrics(metrics, storage) {
    const suggestions = [];
    for (const metric of metrics) {
        // Check if function is slow
        if (metric.avgTimeNs > 1_000_000) { // > 1ms
            suggestions.push(`Function '${metric.functionName}' is slow (avg ${(metric.avgTimeNs / 1_000_000).toFixed(2)}ms) - consider optimization`);
        }
        // Check memory usage
        if (metric.memoryBytes > 1_000_000) { // > 1MB
            suggestions.push(`Function '${metric.functionName}' uses significant memory (${(metric.memoryBytes / 1_000_000).toFixed(2)}MB)`);
        }
    }
    return suggestions;
}
function maybeBenchmark(ctx, project) {
    if (!project.is_benchmark_enabled()) {
        return {
            metrics: [],
            suggestions: []
        };
    }
    console.log('[Tester] Running performance benchmarks...');
    const benches = project.discover_benchmarks();
    const metrics = [];
    for (const bench of benches) {
        metrics.push(runBenchmark(bench));
    }
    const suggestions = deriveSuggestionsFromMetrics(metrics, ctx.storage);
    console.log(`[Tester] Benchmarked ${metrics.length} functions`);
    return {
        metrics,
        suggestions
    };
}
class Tester {
    static benchmark(ctx, project) {
        return maybeBenchmark(ctx, project);
    }
}
exports.Tester = Tester;
