"use strict";
// Engine Module: Interface
// Public API for compiler and external tools
Object.defineProperty(exports, "__esModule", { value: true });
exports.engineAPI = exports.UPLimEngineAPI = void 0;
const static_analyzer_1 = require("../analysis/static-analyzer");
const performance_tester_1 = require("../tester/performance-tester");
const vulnerability_scanner_1 = require("../security/vulnerability-scanner");
const lsp_server_1 = require("../editor/lsp-server");
const proposal_generator_1 = require("../evolver/proposal-generator");
const llm_integration_1 = require("../ai/llm-integration");
const syntax_rules_1 = require("../rules/syntax-rules");
class UPLimEngineAPI {
    // Analysis
    async analyzeCode(code) {
        const issues = static_analyzer_1.staticAnalyzer.analyze(code);
        const security = vulnerability_scanner_1.vulnerabilityScanner.scan(code);
        const syntaxCheck = syntax_rules_1.syntaxRules.validateCode(code);
        return {
            issues,
            security,
            syntaxCheck,
            summary: {
                totalIssues: issues.length,
                criticalIssues: issues.filter(i => i.severity >= 8).length,
                securityThreats: security.threats.length,
                riskScore: security.riskScore,
                syntaxValid: syntaxCheck.valid,
            },
        };
    }
    // Performance
    async benchmarkCode(code) {
        return await performance_tester_1.performanceTester.benchmark(code, 'user-code');
    }
    async profileCode(code, target = 'js') {
        return await performance_tester_1.performanceTester.profileCode(code, target);
    }
    // Security
    scanSecurity(code) {
        return vulnerability_scanner_1.vulnerabilityScanner.scan(code);
    }
    // LSP
    getLSPServer() {
        return lsp_server_1.lspServer;
    }
    // Evolution
    async generateProposals(context) {
        return await proposal_generator_1.proposalGenerator.generateFromAnalysis([]);
    }
    // AI
    async analyzeWithAI(code, task) {
        if (llm_integration_1.llmIntegration.isConfigured()) {
            return await llm_integration_1.llmIntegration.analyze({
                code,
                context: 'User request',
                task,
                ideology: {},
            });
        }
        return {
            suggestions: ['AI provider not configured'],
            improvements: [],
            risks: [],
            confidence: 0,
        };
    }
    // Status
    getEngineStatus() {
        return {
            version: '1.0.0',
            modules: {
                analysis: true,
                performance: true,
                security: true,
                lsp: true,
                ai: llm_integration_1.llmIntegration.isConfigured(),
            },
            uptime: process.uptime ? process.uptime() : 0,
        };
    }
}
exports.UPLimEngineAPI = UPLimEngineAPI;
exports.engineAPI = new UPLimEngineAPI();
