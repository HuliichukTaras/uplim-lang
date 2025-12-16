export type SourceCode = string;
export type FilePath = string;
export type Target = "native" | "wasm" | "bytecode";
export type DiagnosticSeverity = "info" | "warning" | "error";
export interface Location {
    line: number;
    column: number;
    file: string;
}
export interface Diagnostic {
    message: string;
    severity: DiagnosticSeverity;
    location: Location;
    code: string;
}
export interface ParseOptions {
    enableExperimentalSyntax: boolean;
}
export interface AnalyzeOptions {
    enableFlowAnalysis: boolean;
}
export interface CompileOptions {
    optimizationLevel: number;
    target: Target;
    debugSymbols: boolean;
}
export interface ParseResult {
    ast: any | null;
    diagnostics: Diagnostic[];
}
export interface AnalyzeResult {
    diagnostics: Diagnostic[];
    typesOk: boolean;
}
export interface CompileResult {
    success: boolean;
    diagnostics: Diagnostic[];
    outputPath: FilePath | null;
}
export interface ProjectHandle {
    root: FilePath;
    load_all_ast(): any[];
    is_benchmark_enabled(): boolean;
    discover_benchmarks(): any[];
}
export declare class CompilerAPI {
    parse_file(path: FilePath, opts: ParseOptions): ParseResult;
    parse_source(code: SourceCode, opts: ParseOptions): ParseResult;
    analyze_ast(ast: any, opts: AnalyzeOptions): AnalyzeResult;
    compile_project(entry: FilePath, opts: CompileOptions): CompileResult;
    get_project_handle(root: FilePath): ProjectHandle;
    private parseUPLimSyntax;
    private analyzeControlFlow;
    private checkTypes;
    private generateCode;
    private readFile;
    private loadAllASTFromProject;
    private checkBenchmarkConfig;
    private findBenchmarks;
}
export declare const compilerAPI: CompilerAPI;
