export type RuleKind = 'syntax' | 'style' | 'safety' | 'performance';
export type RuleId = string;
export interface RuleContext {
    fileName: string;
    projectRoot: string;
}
export interface RuleResult {
    diagnostics: Array<{
        message: string;
        severity: 'info' | 'warning' | 'error';
        location: any;
    }>;
}
export interface Rule {
    id: RuleId;
    kind: RuleKind;
    description: string;
    apply: (node: any, ctx: RuleContext) => RuleResult;
}
export interface RulesRegistry {
    rules: Rule[];
}
export declare function loadDefaultRules(): RulesRegistry;
