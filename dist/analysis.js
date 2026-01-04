"use strict";
// Static Analysis Module
Object.defineProperty(exports, "__esModule", { value: true });
exports.Analyzer = void 0;
class Analyzer {
    analyze(parseResult, source, filename) {
        const diagnostics = [];
        // Convert parse errors to diagnostics
        parseResult.errors.forEach(error => {
            diagnostics.push({
                type: error.severity === 'error' ? 'error' : 'warning',
                message: error.message,
                file: filename,
                line: error.line,
                column: error.column,
                rule: 'syntax'
            });
        });
        // Analyze code patterns
        const lines = source.split('\n');
        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmed = line.trim();
            // Check for unsafe patterns
            if (trimmed.includes('unsafe')) {
                diagnostics.push({
                    type: 'warning',
                    message: 'Unsafe block detected - ensure this is necessary',
                    file: filename,
                    line: lineNum,
                    column: trimmed.indexOf('unsafe') + 1,
                    rule: 'safety.unsafe-block'
                });
            }
            // Check for TODO comments
            if (trimmed.includes('TODO') || trimmed.includes('FIXME')) {
                diagnostics.push({
                    type: 'info',
                    message: 'TODO comment found',
                    file: filename,
                    line: lineNum,
                    column: 1,
                    rule: 'quality.todo'
                });
            }
            // Check for long lines
            if (line.length > 100) {
                diagnostics.push({
                    type: 'info',
                    message: 'Line exceeds 100 characters',
                    file: filename,
                    line: lineNum,
                    column: 100,
                    rule: 'style.line-length'
                });
            }
        });
        // Calculate metrics
        const metrics = this.calculateMetrics(parseResult.ast, source);
        return { diagnostics, metrics };
    }
    calculateMetrics(ast, source) {
        const lines = source.split('\n');
        const codeLines = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;
        const commentLines = lines.filter(l => l.trim().startsWith('//')).length;
        const functions = ast.body?.filter((n) => n.type === 'FunctionDeclaration').length || 0;
        const types = ast.body?.filter((n) => n.type === 'TypeDeclaration').length || 0;
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
