"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RulesRegistry = void 0;
class RulesRegistry {
    rules;
    constructor(rules) {
        this.rules = rules;
    }
    static load_default() {
        const rules = [
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
exports.RulesRegistry = RulesRegistry;
