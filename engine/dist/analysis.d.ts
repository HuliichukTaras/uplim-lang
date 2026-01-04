import { ParseResult } from './parser';
export interface Diagnostic {
    type: 'error' | 'warning' | 'info';
    message: string;
    file: string;
    line: number;
    column: number;
    rule: string;
}
export interface AnalysisResult {
    diagnostics: Diagnostic[];
    metrics: CodeMetrics;
}
export interface CodeMetrics {
    totalLines: number;
    codeLines: number;
    commentLines: number;
    functions: number;
    types: number;
    complexity: number;
}
export declare class Analyzer {
    private diagnostics;
    private filename;
    analyze(parseResult: ParseResult, source: string, filename: string): AnalysisResult;
    private visit;
    private visitFunction;
    private visitIf;
    private visitVariable;
    private report;
    private calculateMetrics;
}
