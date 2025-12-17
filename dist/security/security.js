"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Security = void 0;
exports.runSecurityScan = runSecurityScan;
function findThreadRisks(ast) {
    const issues = [];
    function visit(node) {
        if (!node)
            return;
        // Check for unsafe concurrent access
        if (node.type === 'ConcurrentAccess' && !node.mutex && !node.atomic) {
            issues.push({
                severity: 'high',
                message: 'Concurrent access without synchronization',
                location: node.location,
                category: 'concurrency'
            });
        }
        if (node.children) {
            node.children.forEach(visit);
        }
    }
    visit(ast);
    return issues;
}
function findUnsafeMemoryPatterns(ast) {
    const issues = [];
    function visit(node) {
        if (!node)
            return;
        // Check for manual memory management
        if (node.type === 'ManualAlloc') {
            issues.push({
                severity: 'critical',
                message: 'Manual memory allocation detected - use ARC instead',
                location: node.location,
                category: 'memory'
            });
        }
        // Check for buffer operations without bounds checking
        if (node.type === 'BufferOperation' && !node.boundsChecked) {
            issues.push({
                severity: 'high',
                message: 'Buffer operation without bounds checking',
                location: node.location,
                category: 'memory'
            });
        }
        if (node.children) {
            node.children.forEach(visit);
        }
    }
    visit(ast);
    return issues;
}
function findUnvalidatedInputs(ast) {
    const issues = [];
    function visit(node) {
        if (!node)
            return;
        // Check for unvalidated external inputs
        if (node.type === 'ExternalInput' && !node.validated) {
            issues.push({
                severity: 'medium',
                message: 'External input not validated',
                location: node.location,
                category: 'validation'
            });
        }
        if (node.children) {
            node.children.forEach(visit);
        }
    }
    visit(ast);
    return issues;
}
function runSecurityScan(ctx, project) {
    console.log('[Security] Running security scan...');
    const astList = project.load_all_ast();
    const issues = [];
    for (const ast of astList) {
        issues.push(...findThreadRisks(ast));
        issues.push(...findUnsafeMemoryPatterns(ast));
        issues.push(...findUnvalidatedInputs(ast));
    }
    console.log(`[Security] Found ${issues.length} security issues`);
    return { issues };
}
class Security {
    static runScan(ctx, project) {
        return runSecurityScan(ctx, project);
    }
}
exports.Security = Security;
