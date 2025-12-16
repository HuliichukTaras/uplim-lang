import { EngineContext, ProjectHandle } from '../interface/engine-main';
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';
export interface SecurityIssue {
    severity: SecuritySeverity;
    message: string;
    location: any;
    category: string;
}
export interface SecurityReport {
    issues: SecurityIssue[];
}
export declare function runSecurityScan(ctx: EngineContext, project: ProjectHandle): SecurityReport;
export declare class Security {
    static runScan(ctx: EngineContext, project: ProjectHandle): SecurityReport;
}
