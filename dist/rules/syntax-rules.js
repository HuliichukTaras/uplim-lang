"use strict";
// Engine Module: Syntax Rules
// Defines and validates UPLim syntax patterns
Object.defineProperty(exports, "__esModule", { value: true });
exports.syntaxRules = exports.SyntaxRulesEngine = void 0;
class SyntaxRulesEngine {
    rules = new Map();
    constructor() {
        this.initializeRules();
    }
    initializeRules() {
        this.addRule({
            id: 'keyword-let',
            category: 'keyword',
            pattern: 'let',
            required: true,
            description: 'Variable declaration keyword',
            examples: ['let x be 10', 'let name be "Alice"'],
        });
        this.addRule({
            id: 'keyword-say',
            category: 'keyword',
            pattern: 'say',
            required: true,
            description: 'Output statement keyword',
            examples: ['say "Hello World"', 'say x'],
        });
        this.addRule({
            id: 'keyword-when',
            category: 'keyword',
            pattern: 'when',
            required: true,
            description: 'Conditional statement keyword',
            examples: ['when x greater than 5 do', 'when isValid do'],
        });
        this.addRule({
            id: 'keyword-make',
            category: 'keyword',
            pattern: 'make',
            required: true,
            description: 'Function declaration keyword',
            examples: ['make greet(name) do', 'make async fetchData() do'],
        });
        this.addRule({
            id: 'pattern-no-null',
            category: 'pattern',
            pattern: /\b(null|undefined|None|nil)\b/,
            required: false,
            description: 'Prevent null/undefined usage',
            examples: [],
            antiPatterns: ['let x be null', 'return undefined'],
        });
        this.addRule({
            id: 'pattern-no-var-const',
            category: 'pattern',
            pattern: /\b(var|const)\b/,
            required: false,
            description: 'Prevent JavaScript-style declarations',
            examples: [],
            antiPatterns: ['var x = 10', 'const name = "test"'],
        });
    }
    addRule(rule) {
        this.rules.set(rule.id, rule);
    }
    getRules() {
        return Array.from(this.rules.values());
    }
    getRequiredKeywords() {
        return this.getRules()
            .filter(r => r.required && r.category === 'keyword')
            .map(r => typeof r.pattern === 'string' ? r.pattern : r.id);
    }
    validateCode(code) {
        const violations = [];
        this.rules.forEach(rule => {
            if (rule.antiPatterns) {
                rule.antiPatterns.forEach(antiPattern => {
                    if (code.includes(antiPattern)) {
                        violations.push(`Anti-pattern detected: ${antiPattern} (Rule: ${rule.id})`);
                    }
                });
            }
            if (rule.pattern instanceof RegExp && rule.antiPatterns) {
                const matches = code.match(rule.pattern);
                if (matches) {
                    violations.push(`Pattern violation: ${rule.description}`);
                }
            }
        });
        return {
            valid: violations.length === 0,
            violations,
        };
    }
}
exports.SyntaxRulesEngine = SyntaxRulesEngine;
exports.syntaxRules = new SyntaxRulesEngine();
