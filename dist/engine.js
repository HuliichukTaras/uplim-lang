"use strict";
// UPLim Engine - orchestrates all analysis modules
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPLimEngine = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const parser_1 = require("./parser");
const interpreter_1 = require("./interpreter");
const analysis_1 = require("./analysis");
const security_1 = require("./security");
const storage_1 = require("./storage");
const ai_1 = require("./ai");
class UPLimEngine {
    parser = new parser_1.UPLimParser();
    interpreter = new interpreter_1.Interpreter();
    analyzer = new analysis_1.Analyzer();
    securityAnalyzer = new security_1.SecurityAnalyzer();
    aiAnalyzer = new ai_1.AIAnalyzer();
    storage;
    constructor(projectRoot) {
        this.storage = new storage_1.Storage(projectRoot);
    }
    async analyze(targetPath, options = {}) {
        console.log(`[Engine] Analyzing: ${targetPath}`);
        const files = this.findUPLimFiles(targetPath);
        console.log(`[Engine] Found ${files.length} .upl files`);
        const fileReports = [];
        for (const file of files) {
            console.log(`[Engine] Processing: ${file}`);
            const report = this.analyzeFile(file);
            fileReports.push(report);
        }
        const summary = this.generateSummary(fileReports);
        const report = {
            timestamp: new Date().toISOString(),
            projectPath: targetPath,
            files: fileReports,
            summary
        };
        // Optional AI analysis
        if (options.ai) {
            console.log('[Engine] Running AI analysis...');
            report.aiAnalysis = await this.aiAnalyzer.analyze(JSON.stringify(summary));
        }
        // Save report
        const reportPath = this.storage.saveReport(report);
        console.log(`[Engine] Report saved: ${reportPath}`);
        return report;
    }
    execute(source) {
        const parseResult = this.parser.parse(source, 'exec.upl');
        if (parseResult.errors.length > 0) {
            const err = parseResult.errors[0];
            throw new Error(`Parse Error: ${err.message} at line ${err.line}:${err.column}`);
        }
        return this.interpreter.evaluate(parseResult.ast);
    }
    analyzeFile(filepath) {
        const source = fs.readFileSync(filepath, 'utf-8');
        // Parse
        const parseResult = this.parser.parse(source, filepath);
        // Analyze
        const analysisResult = this.analyzer.analyze(parseResult, source, filepath);
        // Security scan
        // Note: Security analyzer expects ASTNode but Program is compatible
        const securityReport = this.securityAnalyzer.analyze(parseResult.ast, source, filepath);
        return {
            path: filepath,
            diagnostics: analysisResult.diagnostics,
            security: securityReport.issues,
            metrics: analysisResult.metrics
        };
    }
    findUPLimFiles(targetPath) {
        const files = [];
        const traverse = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    try {
                        traverse(fullPath);
                    }
                    catch (e) {
                        // Ignore errors accessing restricted directories
                    }
                }
                else if (entry.isFile() && entry.name.endsWith('.upl')) {
                    files.push(fullPath);
                }
            }
        };
        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
            traverse(targetPath);
        }
        else if (targetPath.endsWith('.upl') && fs.existsSync(targetPath)) {
            files.push(targetPath);
        }
        return files;
    }
    generateSummary(fileReports) {
        let totalDiagnostics = 0;
        let errorCount = 0;
        let warningCount = 0;
        let totalComplexity = 0;
        let securityScoreSum = 0;
        fileReports.forEach(report => {
            totalDiagnostics += report.diagnostics.length;
            errorCount += report.diagnostics.filter(d => d.type === 'error').length;
            warningCount += report.diagnostics.filter(d => d.type === 'warning').length;
            totalComplexity += report.metrics.complexity;
            // Calculate file security score
            const criticalCount = report.security.filter(s => s.severity === 'critical').length;
            const highCount = report.security.filter(s => s.severity === 'high').length;
            securityScoreSum += Math.max(0, 100 - (criticalCount * 25 + highCount * 10));
        });
        return {
            totalFiles: fileReports.length,
            totalDiagnostics,
            errorCount,
            warningCount,
            securityScore: fileReports.length > 0 ? Math.floor(securityScoreSum / fileReports.length) : 100,
            averageComplexity: fileReports.length > 0 ? totalComplexity / fileReports.length : 0
        };
    }
}
exports.UPLimEngine = UPLimEngine;
