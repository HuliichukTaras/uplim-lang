import { ASTNode } from './parser';
export interface SecurityIssue {
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    message: string;
    file: string;
    line: number;
    recommendation: string;
}
export interface SecurityReport {
    issues: SecurityIssue[];
    score: number;
}
export declare class SecurityAnalyzer {
    analyze(ast: ASTNode, source: string, filename: string): SecurityReport;
}
