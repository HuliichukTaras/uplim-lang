import { EngineReport } from './engine';
export declare class Storage {
    private reportsDir;
    constructor(projectRoot: string);
    private ensureDirectoryExists;
    saveReport(report: EngineReport): string;
    loadLatestReport(): EngineReport | null;
    getReportHistory(limit?: number): EngineReport[];
}
