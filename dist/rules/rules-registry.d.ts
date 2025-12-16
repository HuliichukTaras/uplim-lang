export type RuleKind = "syntax" | "style" | "safety" | "performance";
export type RuleId = string;
export interface RuleContext {
    node: any;
    parent: any;
}
export interface RuleResult {
    diagnostics: any[];
}
export interface Rule {
    id: RuleId;
    kind: RuleKind;
    description: string;
    apply: (node: any, context: RuleContext) => RuleResult;
}
export declare class RulesRegistry {
    rules: Rule[];
    constructor(rules: Rule[]);
    static load_default(): RulesRegistry;
}
