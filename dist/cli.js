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
const commander_1 = require("commander");
const engine_1 = require("./engine");
const parser_1 = require("./parser");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const compiler_1 = require("./compiler");
const program = new commander_1.Command();
program
    .name('uplim-engine')
    .description('UPLim Language Analysis Engine')
    .version('0.1.0');
program
    .command('analyze')
    .description('Analyze UPLim project or file')
    .argument('[path]', 'Path to analyze', '.')
    .option('--ai', 'Enable AI-powered suggestions')
    .action(async (targetPath, options) => {
    try {
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
        // Show diagnostics
        if (report.summary.totalDiagnostics > 0) {
            console.log('DIAGNOSTICS:');
            report.files.forEach(file => {
                if (file.diagnostics.length > 0) {
                    console.log(`\n  ${file.path}:`);
                    file.diagnostics.forEach(d => {
                        const icon = d.type === 'error' ? '✗' : d.type === 'warning' ? '⚠' : 'ℹ';
                        console.log(`    ${icon} Line ${d.line}: ${d.message} [${d.rule}]`);
                    });
                }
            });
            console.log('');
        }
        // Show security issues
        const allSecurityIssues = report.files.flatMap(f => f.security);
        if (allSecurityIssues.length > 0) {
            console.log('SECURITY ISSUES:');
            allSecurityIssues.forEach(issue => {
                console.log(`  [${issue.severity.toUpperCase()}] ${issue.message}`);
                console.log(`    File: ${issue.file}:${issue.line}`);
                console.log(`    Fix: ${issue.recommendation}`);
                console.log('');
            });
        }
        // Show AI analysis if available
        if (report.aiAnalysis) {
            console.log('AI INSIGHTS:');
            report.aiAnalysis.suggestions.forEach(s => console.log(`  • ${s}`));
            console.log('');
        }
        console.log('='.repeat(60));
        console.log(`Report saved to .uplim/reports/`);
        console.log('='.repeat(60));
        process.exit(report.summary.errorCount > 0 ? 1 : 0);
    }
    catch (error) {
        console.error('Engine error:', error);
        process.exit(1);
    }
});
program
    .command('run')
    .description('Run a UPLim file')
    .argument('<file>', 'File to run')
    .action(async (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            process.exit(1);
        }
        const source = fs.readFileSync(filePath, 'utf-8');
        const engine = new engine_1.UPLimEngine(process.cwd()); // Added required projectRoot argument
        engine.execute(source);
    }
    catch (error) {
        console.error(error.message);
        process.exit(1);
    }
});
program
    .command('compile <file>')
    .description('Compile a .upl file to JavaScript')
    .option('-o, --output <output>', 'Output JavaScript file')
    .action((file, options) => {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const parser = new parser_1.UPLimParser();
    const result = parser.parse(content, filePath);
    if (result.errors.length > 0) {
        console.error('Compilation failed with errors:');
        result.errors.forEach(err => console.error(err));
        process.exit(1);
    }
    const compiler = new compiler_1.Compiler();
    const jsCode = compiler.compile(result.ast);
    const outputPath = options.output || file.replace(/\.upl$/, '.js');
    fs.writeFileSync(outputPath, jsCode);
    console.log(`Compiled to ${outputPath}`);
});
program
    .command('ai <prompt>')
    .description('Ask local AI (Ollama) for help with UPLim code')
    .option('-m, --model <model>', 'Ollama model to use', 'codellama:13b')
    .action(async (prompt, options) => {
    const model = options.model;
    const url = 'http://localhost:11434/api/generate';
    console.log(`🤖 Asking ${model}: "${prompt}"...`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                prompt: `You are an expert UPLim programmer. ${prompt}`,
                stream: false
            })
        });
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('\nResult:\n');
        console.log(data.response);
    }
    catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('Error: Could not connect to Ollama. Is it running at http://localhost:11434?');
        }
        else {
            console.error('Error talking to AI:', error.message);
        }
    }
});
program.parse(process.argv);
