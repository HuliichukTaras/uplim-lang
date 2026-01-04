"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = void 0;
class Interpreter {
    environment = new Map();
    output = [];
    interpret(ast) {
        this.output = [];
        this.environment.clear();
        // Default environment (optional built-ins)
        this.environment.set("PI", 3.14159);
        for (const stmt of ast.body) {
            this.execute(stmt);
        }
        return this.output.join('\n');
    }
    execute(stmt) {
        switch (stmt.type) {
            case 'VariableDeclaration':
                this.visitVariableDeclaration(stmt);
                break;
            case 'PrintStatement':
                this.visitPrintStatement(stmt);
                break;
            case 'IfStatement':
                this.visitIfStatement(stmt);
                break;
            case 'FunctionDeclaration':
                // Store function definition in environment? 
                // For now, ignoring or basic storage.
                // Needs "Callable" type wrapper.
                // Skip for MVP unless needed.
                break;
            case 'ExpressionStatement':
                this.evaluate(stmt.expression);
                break;
        }
    }
    visitVariableDeclaration(stmt) {
        const value = this.evaluate(stmt.value);
        this.environment.set(stmt.name, value);
    }
    visitPrintStatement(stmt) {
        const value = this.evaluate(stmt.expression);
        this.output.push(String(value));
    }
    visitIfStatement(stmt) {
        const condition = this.evaluate(stmt.condition);
        if (this.isTruthy(condition)) {
            for (const s of stmt.thenBranch) {
                this.execute(s);
            }
        }
        else if (stmt.elseBranch) {
            for (const s of stmt.elseBranch) {
                this.execute(s);
            }
        }
    }
    evaluate(expr) {
        switch (expr.type) {
            case 'Literal':
                return expr.value;
            case 'Identifier':
                return this.lookupVariable(expr.name);
            case 'BinaryExpression':
                return this.visitBinary(expr);
            case 'CallExpression':
                // Implement call if needed
                return null;
            default:
                return null;
        }
    }
    lookupVariable(name) {
        if (this.environment.has(name)) {
            return this.environment.get(name);
        }
        throw new Error(`Undefined variable '${name}'`);
    }
    visitBinary(expr) {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);
        switch (expr.operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            case '>': return left > right;
            case '<': return left < right;
            case '==': return left === right;
            case '!=': return left !== right;
            case '>=': return left >= right;
            case '<=': return left <= right;
            default: return null;
        }
    }
    isTruthy(value) {
        if (value === null)
            return false;
        if (value === false)
            return false;
        if (value === 0)
            return false;
        return true;
    }
}
exports.Interpreter = Interpreter;
