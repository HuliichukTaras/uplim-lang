"use strict";
// Engine Module: AI Integration
// Optional LLM integration for advanced pattern detection and suggestions
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmIntegration = exports.LLMIntegration = void 0;
class LLMIntegration {
    provider;
    apiKey;
    constructor(provider = 'openai') {
        this.provider = provider;
        this.apiKey = process.env.OLLAMA_MODEL ? 'configured' : undefined;
    }
    async analyze(request) {
        if (!this.apiKey) {
            return {
                suggestions: ['AI provider not configured'],
                improvements: [],
                risks: [],
                confidence: 0,
            };
        }
        try {
            const response = await fetch('/api/generate-proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: request.code,
                    context: request.context,
                    task: request.task,
                    ideology: request.ideology,
                }),
            });
            if (!response.ok) {
                throw new Error('AI analysis failed');
            }
            const data = await response.json();
            return {
                suggestions: [data.title],
                improvements: [data.description],
                risks: data.violations || [],
                confidence: 0.85,
            };
        }
        catch (error) {
            console.error('[AI] Analysis failed:', error);
            return {
                suggestions: [],
                improvements: [],
                risks: [],
                confidence: 0,
            };
        }
    }
    async generateOptimization(code) {
        const analysis = await this.analyze({
            code,
            context: 'Code optimization',
            task: 'optimize',
            ideology: {},
        });
        return analysis.improvements.join('\n');
    }
    async detectPatterns(codebase) {
        // Analyze multiple files to detect common patterns
        return ['Pattern detection requires AI provider configuration'];
    }
    isConfigured() {
        return !!this.apiKey;
    }
}
exports.LLMIntegration = LLMIntegration;
exports.llmIntegration = new LLMIntegration();
