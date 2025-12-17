"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openStorage = openStorage;
exports.saveReport = saveReport;
exports.loadReports = loadReports;
exports.getLatestReport = getLatestReport;
function openStorage(path) {
    console.log(`[Storage] Opening storage at ${path}`);
    return {
        path,
        data: new Map()
    };
}
function saveReport(storage, project, analysis, security, perf, evolution) {
    const report = {
        timestamp: Date.now(),
        projectRoot: project.root,
        analysis,
        security,
        performance: perf,
        evolution
    };
    const key = `report_${project.root}_${report.timestamp}`;
    storage.data.set(key, report);
    console.log(`[Storage] Saved report with key: ${key}`);
}
function loadReports(storage, projectRoot) {
    const reports = [];
    for (const [key, value] of storage.data.entries()) {
        if (key.startsWith(`report_${projectRoot}_`)) {
            reports.push(value);
        }
    }
    return reports.sort((a, b) => b.timestamp - a.timestamp);
}
function getLatestReport(storage, projectRoot) {
    const reports = loadReports(storage, projectRoot);
    return reports.length > 0 ? reports[0] : null;
}
