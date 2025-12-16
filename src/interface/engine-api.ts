// Engine Module: Interface
// Public API for compiler and external tools

import { staticAnalyzer } from '../analysis/static-analyzer';
import { performanceTester } from '../tester/performance-tester';
import { vulnerabilityScanner } from '../security/vulnerability-scanner';
import { lspServer } from '../editor/lsp-server';
import { proposalGenerator } from '../evolver/proposal-generator';
import { llmIntegration } from '../ai/llm-integration';
import { syntaxRules } from '../rules/syntax-rules';

export class UPLimEngineAPI {
  // Analysis
  async analyzeCode(code: string) {
    const issues = staticAnalyzer.analyze(code);
    const security = vulnerabilityScanner.scan(code);
    const syntaxCheck = syntaxRules.validateCode(code);

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
  async benchmarkCode(code: string) {
    return await performanceTester.benchmark(code, 'user-code');
  }

  async profileCode(code: string, target: 'wasm' | 'native' | 'js' = 'js') {
    return await performanceTester.profileCode(code, target);
  }

  // Security
  scanSecurity(code: string) {
    return vulnerabilityScanner.scan(code);
  }

  // LSP
  getLSPServer() {
    return lspServer;
  }

  // Evolution
  async generateProposals(context: string) {
    return await proposalGenerator.generateFromAnalysis([]);
  }

  // AI
  async analyzeWithAI(code: string, task: 'optimize' | 'fix' | 'refactor' | 'explain' | 'suggest') {
    if (llmIntegration.isConfigured()) {
      return await llmIntegration.analyze({
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
        ai: llmIntegration.isConfigured(),
      },
      uptime: process.uptime ? process.uptime() : 0,
    };
  }
}

export const engineAPI = new UPLimEngineAPI();
