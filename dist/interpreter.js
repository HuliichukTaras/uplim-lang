"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Interpreter = exports.Environment = void 0;
class Environment {
    values = new Map();
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    define(name, value) {
        this.values.set(name, value);
    }
    get(name) {
        if (this.values.has(name))
            return this.values.get(name);
        if (this.parent)
            return this.parent.get(name);
        throw new Error(`Undefined variable '${name}'`);
    }
    assign(name, value) {
        if (this.values.has(name)) { // Fixed 'values' vs 'vars' from previous edit context
            this.values.set(name, value);
            return;
        }
        if (this.parent) {
            this.parent.assign(name, value);
            return;
        }
        throw new Error(`Undefined variable '${name}'`);
    }
}
exports.Environment = Environment;
class ReturnException extends Error {
    value;
    constructor(value) {
        super("Return");
        this.value = value;
    }
}
class Interpreter {
    globalEnv = new Environment();
    output = []; // Capture output for testing
    constructor() {
        // Define native functions if needed
    }
    evaluate(program) {
        this.output = [];
        this.executeBlock(program.body, this.globalEnv);
        return this.output;
    }
    executeBlock(statements, env) {
        let result = null;
        for (const stmt of statements) {
            result = this.execute(stmt, env);
        }
        return result;
    }
    execute(stmt, env) {
        switch (stmt.type) {
            case 'VariableDeclaration':
                return this.visitVariableDeclaration(stmt, env);
            case 'FunctionDeclaration':
                return this.visitFunctionDeclaration(stmt, env);
            case 'SayStatement':
                return this.visitSayStatement(stmt, env);
            case 'IfStatement':
                return this.visitIfStatement(stmt, env);
            case 'ExpressionStatement':
                return this.visitExpression(stmt, env);
            case 'BlockStatement':
                return this.visitBlockStatement(stmt, env);
            case 'ReturnStatement': {
                const rs = stmt;
                let val = null;
                if (rs.argument)
                    val = this.evaluateExpression(rs.argument, env);
                throw new ReturnException(val);
            }
            default:
                throw new Error(`Unknown statement type: ${stmt.type}`);
        }
    }
    visitVariableDeclaration(node, env) {
        const value = this.evaluateExpression(node.value, env);
        if (node.pattern.type === 'Identifier') {
            env.define(node.pattern.name, value);
        }
        else if (node.pattern.type === 'ObjectPattern') {
            // Assume value is object
            if (typeof value !== 'object' || value === null)
                throw new Error("Destructuring error: value is not an object");
            // @ts-ignore
            const safeValue = value;
            for (const prop of node.pattern.properties) {
                // Assuming prop.key is the property name in the object and prop.value is the variable name
                env.define(prop.value, safeValue[prop.key]);
            }
        }
        else if (node.pattern.type === 'ArrayPattern') {
            if (!Array.isArray(value))
                throw new Error("Destructuring error: value is not an array");
            for (let i = 0; i < node.pattern.elements.length; i++) {
                const variableName = node.pattern.elements[i];
                if (i < value.length) {
                    env.define(variableName, value[i]);
                }
                else {
                    env.define(variableName, undefined);
                }
            }
        }
        else {
            throw new Error(`Unsupported variable declaration pattern type: ${node.pattern.type}`);
        }
        return value;
    }
    visitFunctionDeclaration(stmt, env) {
        env.define(stmt.name, {
            type: 'function',
            declaration: stmt,
            closure: env
        });
    }
    visitSayStatement(stmt, env) {
        const value = this.evaluateExpression(stmt.argument, env);
        console.log(value);
        this.output.push(String(value));
    }
    visitIfStatement(stmt, env) {
        const condition = this.evaluateExpression(stmt.test, env);
        if (this.isTruthy(condition)) {
            return this.execute(stmt.consequent, env);
        }
        else if (stmt.alternate) {
            return this.execute(stmt.alternate, env);
        }
    }
    visitBlockStatement(stmt, env) {
        const newEnv = new Environment(env);
        return this.executeBlock(stmt.body, newEnv);
    }
    visitExpression(stmt, env) {
        return this.evaluateExpression(stmt.expression, env);
    }
    evaluateExpression(expr, env) {
        switch (expr.type) {
            case 'Literal':
                return expr.value;
            case 'Identifier':
                return env.get(expr.name);
            case 'BinaryExpression':
                return this.visitBinaryExpression(expr, env);
            case 'CallExpression':
                return this.visitCallExpression(expr, env);
            case 'PipelineExpression': {
                const pipe = expr;
                const leftVal = this.evaluateExpression(pipe.left, env);
                if (pipe.right.type === 'Identifier') {
                    const func = env.get(pipe.right.name);
                    if (func && func.type === 'function') {
                        const funcDecl = func.declaration;
                        if (funcDecl.params.length !== 1) {
                            throw new Error(`Function ${funcDecl.name} in pipeline expects 1 argument but got ${funcDecl.params.length}`);
                        }
                        const scope = new Environment(func.closure);
                        scope.define(funcDecl.params[0], leftVal);
                        // Handle implicit/explicit return
                        try {
                            return this.executeBlock(funcDecl.body.body, scope);
                        }
                        catch (e) {
                            if (e instanceof ReturnException)
                                return e.value;
                            throw e;
                        }
                    }
                    else {
                        throw new Error(`'${pipe.right.name}' is not a function and cannot be used in a pipeline.`);
                    }
                }
                throw new Error("Pipeline right side must be a function identifier");
            }
            case 'RangeExpression': {
                const range = expr;
                const start = this.evaluateExpression(range.start, env);
                const end = this.evaluateExpression(range.end, env);
                const step = range.step ? this.evaluateExpression(range.step, env) : 1;
                const result = [];
                if (step > 0) {
                    for (let i = start; i <= end; i += step)
                        result.push(i);
                }
                else if (step < 0) {
                    for (let i = start; i >= end; i += step)
                        result.push(i);
                }
                else {
                    throw new Error("Range step cannot be zero.");
                }
                return result;
            }
            case 'ArrayLiteral': {
                const arr = expr;
                return arr.elements.map(e => this.evaluateExpression(e, env));
            }
            case 'ObjectLiteral': {
                const obj = expr;
                const result = {};
                for (const prop of obj.properties) {
                    result[prop.key] = this.evaluateExpression(prop.value, env);
                }
                return result;
            }
            case 'ListComprehension': {
                const comp = expr;
                const source = this.evaluateExpression(comp.source, env);
                if (!Array.isArray(source))
                    throw new Error("Comprehension source must be an array");
                const result = [];
                const comprehensionEnv = new Environment(env);
                for (const item of source) {
                    comprehensionEnv.define(comp.element, item);
                    let include = true;
                    if (comp.filter) {
                        include = this.evaluateExpression(comp.filter, comprehensionEnv);
                    }
                    if (include) {
                        result.push(this.evaluateExpression(comp.expression, comprehensionEnv));
                    }
                }
                return result;
            }
            case 'FunctionExpression': {
                const funcExpr = expr;
                return {
                    type: 'function',
                    declaration: funcExpr, // FunctionExpression structure matches what we need
                    closure: env
                };
            }
            default:
                throw new Error(`Unknown expression type: ${expr.type}`);
        }
    }
    visitBinaryExpression(expr, env) {
        const left = this.evaluateExpression(expr.left, env);
        const right = this.evaluateExpression(expr.right, env);
        switch (expr.operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            case '>': return left > right;
            case '<': return left < right;
            default: throw new Error(`Unknown operator: ${expr.operator}`);
        }
    }
    visitCallExpression(expr, env) {
        const callee = env.get(expr.callee.name);
        if (callee && callee.type === 'function') {
            const func = callee.declaration;
            const args = expr.arguments.map(arg => this.evaluateExpression(arg, env));
            if (args.length !== func.params.length) {
                throw new Error(`Function ${func.name} expects ${func.params.length} arguments but got ${args.length}`);
            }
            const scope = new Environment(callee.closure);
            for (let i = 0; i < func.params.length; i++) {
                scope.define(func.params[i], args[i]);
            }
            // Execute body and return result (implicit return of last statement) or explicit return
            try {
                return this.executeBlock(func.body.body, scope);
            }
            catch (e) {
                if (e instanceof ReturnException) {
                    return e.value;
                }
                throw e;
            }
        }
        throw new Error(`'${expr.callee.name}' is not a function`);
    }
    isTruthy(val) {
        return !!val;
    }
}
exports.Interpreter = Interpreter;
