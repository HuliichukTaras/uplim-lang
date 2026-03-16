#!/usr/bin/env node
"use strict";
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
const path = __importStar(require("path"));
const engine_1 = require("./engine");
function printUsage() {
    console.log(`UPLim Engine

Usage:
  uplim-engine analyze [path] [--ai]
  uplim-engine --help
  uplim-engine --version
`);
}
function parseAnalyzeArgs(args) {
    const options = {};
    let targetPath = '.';
    for (const arg of args) {
        if (arg === '--ai') {
            options.ai = true;
            continue;
        }
        if (arg.startsWith('-')) {
            throw new Error(`Unknown option: ${arg}`);
        }
        targetPath = arg;
    }
    return { targetPath, options };
}
async function analyzeCommand(targetPath, options) {
    const absolutePath = path.resolve(targetPath);
    const projectRoot = process.cwd();
    console.log('='.repeat(60));
    console.log('UPLim Engine - Analysis Report');
    console.log('='.repeat(60));
    console.log('');
    const engine = new engine_1.UPLimEngine(projectRoot);
    const report = await engine.analyze(absolutePath, options);
    console.log('');
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Files analyzed:     ${report.summary.totalFiles}`);
    console.log(`Total diagnostics:  ${report.summary.totalDiagnostics}`);
    console.log(`  - Errors:         ${report.summary.errorCount}`);
    console.log(`  - Warnings:       ${report.summary.warningCount}`);
    console.log(`Security score:     ${report.summary.securityScore}/100`);
    console.log(`Avg complexity:     ${report.summary.averageComplexity.toFixed(1)}`);
    console.log('');
    if (report.summary.totalDiagnostics > 0) {
        console.log('DIAGNOSTICS:');
        report.files.forEach(file => {
            if (file.diagnostics.length === 0) {
                return;
            }
            console.log(`\n  ${file.path}:`);
            file.diagnostics.forEach(diagnostic => {
                const icon = diagnostic.type === 'error' ? '✗' : diagnostic.type === 'warning' ? '⚠' : 'ℹ';
                console.log(`    ${icon} Line ${diagnostic.line}: ${diagnostic.message} [${diagnostic.rule}]`);
            });
        });
        console.log('');
    }
    const allSecurityIssues = report.files.flatMap(file => file.security);
    if (allSecurityIssues.length > 0) {
        console.log('SECURITY ISSUES:');
        allSecurityIssues.forEach(issue => {
            console.log(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
            console.log(`    File: ${issue.file}:${issue.line}`);
            console.log(`    Fix: ${issue.recommendation}`);
            console.log('');
        });
    }
    if (report.aiAnalysis) {
        console.log('AI INSIGHTS:');
        report.aiAnalysis.suggestions.forEach(suggestion => console.log(`  • ${suggestion}`));
        console.log('');
    }
    console.log('='.repeat(60));
    console.log('Report saved to .uplim/reports/');
    console.log('='.repeat(60));
    return report.summary.errorCount > 0 ? 1 : 0;
}
async function main() {
    const [, , rawCommand, ...args] = process.argv;
    if (!rawCommand || rawCommand === '--help' || rawCommand === '-h') {
        printUsage();
        return;
    }
    if (rawCommand === '--version' || rawCommand === '-v') {
        console.log('0.1.0');
        return;
    }
    try {
        switch (rawCommand) {
            case 'analyze': {
                const { targetPath, options } = parseAnalyzeArgs(args);
                process.exit(await analyzeCommand(targetPath, options));
            }
            default:
                throw new Error(`Unknown command: ${rawCommand}`);
        }
    }
    catch (error) {
        console.error('Engine error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
void main();
