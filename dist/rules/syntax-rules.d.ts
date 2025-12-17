export type SyntaxRule = {
    id: string;
    category: 'keyword' | 'operator' | 'structure' | 'pattern';
    pattern: RegExp | string;
    required: boolean;
    description: string;
    examples: string[];
    antiPatterns?: string[];
};
export declare class SyntaxRulesEngine {
    private rules;
    constructor();
    private initializeRules;
    addRule(rule: SyntaxRule): void;
    getRules(): SyntaxRule[];
    getRequiredKeywords(): string[];
    validateCode(code: string): {
        valid: boolean;
        violations: string[];
    };
}
export declare const syntaxRules: SyntaxRulesEngine;
