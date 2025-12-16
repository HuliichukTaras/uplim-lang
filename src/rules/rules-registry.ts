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

export class RulesRegistry {
  rules: Rule[];

  constructor(rules: Rule[]) {
    this.rules = rules;
  }

  static load_default(): RulesRegistry {
    const rules: Rule[] = [
      {
        id: 'no-implicit-any',
        kind: 'syntax',
        description: 'Variables must have explicit types',
        apply: (node, ctx) => ({ diagnostics: [] }),
      },
      {
        id: 'no-unchecked-concurrency',
        kind: 'safety',
        description: 'Concurrent operations must be properly synchronized',
        apply: (node, ctx) => ({ diagnostics: [] }),
      },
      {
        id: 'consistent-naming',
        kind: 'style',
        description: 'Follow UPLim naming conventions',
        apply: (node, ctx) => ({ diagnostics: [] }),
      },
      {
        id: 'no-unbounded-loops',
        kind: 'performance',
        description: 'Loops must have guards to prevent infinite execution',
        apply: (node, ctx) => ({ diagnostics: [] }),
      },
    ];

    return new RulesRegistry(rules);
  }
}
