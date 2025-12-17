"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDefaultRules = loadDefaultRules;
// Syntax Rules
function noImplicitAny() {
    return {
        id: 'no-implicit-any',
        kind: 'syntax',
        description: 'All variables must have explicit types',
        apply: (node, ctx) => {
            const diagnostics = [];
            // Check if variable declaration lacks type annotation
            if (node.type === 'VariableDeclaration' && !node.typeAnnotation) {
                diagnostics.push({
                    message: 'Variable must have explicit type annotation',
                    severity: 'error',
                    location: node.location
                });
            }
            return { diagnostics };
        }
    };
}
// Safety Rules
function noUncheckedConcurrency() {
    return {
        id: 'no-unchecked-concurrency',
        kind: 'safety',
        description: 'Concurrent operations must use safe primitives',
        apply: (node, ctx) => {
            const diagnostics = [];
            if (node.type === 'AsyncOperation' && !node.safetyGuard) {
                diagnostics.push({
                    message: 'Async operation must use safe concurrency primitives',
                    severity: 'error',
                    location: node.location
                });
            }
            return { diagnostics };
        }
    };
}
// Style Rules
function consistentNaming() {
    return {
        id: 'consistent-naming',
        kind: 'style',
        description: 'Follow UPLim naming conventions',
        apply: (node, ctx) => {
            const diagnostics = [];
            if (node.type === 'FunctionDeclaration') {
                const name = node.name;
                // Functions should use snake_case
                if (!/^[a-z][a-z0-9_]*$/.test(name)) {
                    diagnostics.push({
                        message: `Function name '${name}' should use snake_case`,
                        severity: 'warning',
                        location: node.location
                    });
                }
            }
            return { diagnostics };
        }
    };
}
// Performance Rules
function noUnboundedLoops() {
    return {
        id: 'no-unbounded-loops',
        kind: 'performance',
        description: 'Loops must have clear bounds or guards',
        apply: (node, ctx) => {
            const diagnostics = [];
            if (node.type === 'WhileLoop' && !node.guard && !node.maxIterations) {
                diagnostics.push({
                    message: 'While loop must have iteration guard or max iterations',
                    severity: 'warning',
                    location: node.location
                });
            }
            return { diagnostics };
        }
    };
}
function loadDefaultRules() {
    return {
        rules: [
            noImplicitAny(),
            noUncheckedConcurrency(),
            consistentNaming(),
            noUnboundedLoops(),
        ]
    };
}
