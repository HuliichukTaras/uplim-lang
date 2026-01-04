"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analyzer = void 0;
class Analyzer {
    diagnostics = [];
    filename = '';
    analyze(parseResult, source, filename) {
        this.diagnostics = [];
        this.filename = filename;
        // Propagate parse errors
        parseResult.errors.forEach(error => {
            this.report({
                type: error.severity === 'error' ? 'error' : 'warning',
                message: error.message,
                line: error.line,
                column: error.column,
                rule: 'syntax'
            });
        });
        // Analyze AST
        if (parseResult.ast) {
            this.visit(parseResult.ast);
        }
        const metrics = this.calculateMetrics(parseResult.ast, source);
        return { diagnostics: this.diagnostics, metrics };
    }
    visit(node) {
        switch (node.type) {
            case 'Program':
                node.body.forEach(n => this.visit(n));
                break;
            case 'FunctionDeclaration':
                this.visitFunction(node);
                break;
            case 'IfStatement':
                this.visitIf(node);
                break;
            case 'VariableDeclaration':
                this.visitVariable(node);
                break;
            case 'PrintStatement':
                this.visit(node.expression);
                break;
            // Expressions usually don't have block children in this simple parser yet, but we could traverse
        }
    }
    visitFunction(node) {
        if (node.name.length < 2) {
            this.report({
                type: 'warning',
                message: `Function name '${node.name}' is too short`,
                line: node.location.line,
                column: node.location.column,
                rule: 'naming'
            });
        }
        // Check parameters
        const uniqueParams = new Set(node.params);
        if (uniqueParams.size !== node.params.length) {
            this.report({
                type: 'error',
                message: 'Duplicate parameter names',
                line: node.location.line,
                column: node.location.column,
                rule: 'naming'
            });
        }
        node.body.forEach(n => this.visit(n));
    }
    visitIf(node) {
        node.thenBranch.forEach(n => this.visit(n));
        if (node.elseBranch) {
            node.elseBranch.forEach(n => this.visit(n));
        }
    }
    visitVariable(node) {
        // Basic check
        if (node.name === 'null') {
            this.report({
                type: 'error',
                message: 'Cannot name variable "null"',
                line: node.location.line,
                column: node.location.column,
                rule: 'syntax'
            });
        }
    }
    report(diagnostic) {
        this.diagnostics.push({ ...diagnostic, file: this.filename });
    }
    calculateMetrics(ast, source) {
        const lines = source.split('\n');
        const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;
        const commentLines = lines.filter(l => l.trim().startsWith('//')).length;
        let functions = 0;
        let types = 0;
        // Simple top-level count
        ast.body.forEach(node => {
            if (node.type === 'FunctionDeclaration')
                functions++;
            if (node.type === 'TypeDeclaration')
                types++;
        });
        return {
            totalLines: lines.length,
            codeLines,
            commentLines,
            functions,
            types,
            complexity: Math.floor(codeLines / 10) + functions * 2
        };
    }
}
exports.Analyzer = Analyzer;
