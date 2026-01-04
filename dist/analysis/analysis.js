"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analysis = void 0;
exports.runAnalysis = runAnalysis;
function walkASTWithRule(ast, rule) {
    const diagnostics = [];
    function visit(node) {
        if (!node)
            return;
        const result = rule.apply(node, { fileName: 'temp.upl', projectRoot: '/' });
        diagnostics.push(...result.diagnostics.map((d) => ({
            ...d,
            code: rule.id
        })));
        // Recursively visit children
        if (node.children) {
            node.children.forEach(visit);
        }
    }
    visit(ast);
    return { diagnostics };
}
function computeProjectMetrics(astList) {
    let totalLines = 0;
    let totalFunctions = 0;
    let totalComplexity = 0;
    let typedDeclarations = 0;
    let totalDeclarations = 0;
    for (const ast of astList) {
        totalLines += ast.lineCount || 0;
        function countNodes(node) {
            if (!node)
                return;
            if (node.type === 'FunctionDeclaration') {
                totalFunctions++;
                totalComplexity += node.complexity || 1;
            }
            if (node.type === 'VariableDeclaration') {
                totalDeclarations++;
                if (node.typeAnnotation)
                    typedDeclarations++;
            }
            if (node.children) {
                node.children.forEach(countNodes);
            }
        }
        countNodes(ast);
    }
    return {
        totalLines,
        totalFunctions,
        averageComplexity: totalFunctions > 0 ? totalComplexity / totalFunctions : 0,
        typesCoverage: totalDeclarations > 0 ? (typedDeclarations / totalDeclarations) * 100 : 100
    };
}
function runAnalysis(ctx, project) {
    console.log('[Analysis] Running static analysis...');
    const astList = project.load_all_ast();
    const diagnostics = [];
    for (const ast of astList) {
        for (const rule of ctx.rules.rules) {
            const result = walkASTWithRule(ast, rule);
            diagnostics.push(...result.diagnostics);
        }
    }
    const metrics = computeProjectMetrics(astList);
    console.log(`[Analysis] Found ${diagnostics.length} issues, metrics computed`);
    return {
        diagnostics,
        metrics
    };
}
class Analysis {
    static run(ctx, project) {
        return runAnalysis(ctx, project);
    }
}
exports.Analysis = Analysis;
