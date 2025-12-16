
import { 
    Program, ASTNode, BinaryExpression, CallExpression, 
    FunctionDeclaration, Identifier, IfStatement, Literal, 
    VariableDeclaration, SayStatement, BlockStatement, ExpressionStatement,
    PipelineExpression, RangeExpression, ListComprehension,
    ArrayLiteral, ObjectLiteral, ObjectPattern, ArrayPattern, ReturnStatement,
    FunctionExpression
} from './parser'

export class Environment {
    private values = new Map<string, any>()
    public parent?: Environment
    
    constructor(parent?: Environment) {
        this.parent = parent
    }
    
    define(name: string, value: any) {
        this.values.set(name, value)
    }
    
    get(name: string): any {
        if (this.values.has(name)) return this.values.get(name)
        if (this.parent) return this.parent.get(name)
        throw new Error(`Undefined variable '${name}'`)
    }

    assign(name: string, value: any) {
         if (this.values.has(name)) { // Fixed 'values' vs 'vars' from previous edit context
             this.values.set(name, value)
             return
         }
         if (this.parent) {
             this.parent.assign(name, value)
             return
         }
         throw new Error(`Undefined variable '${name}'`)
    }
}

class ReturnException extends Error {
    value: any
    constructor(value: any) {
        super("Return")
        this.value = value
    }
}

export class Interpreter {
    private globalEnv = new Environment()
    private output: string[] = [] // Capture output for testing

    constructor() {
        // Define native functions if needed
    }
    
    evaluate(program: Program): string[] {
        this.output = []
        this.executeBlock(program.body, this.globalEnv)
        return this.output
    }
    
    private executeBlock(statements: ASTNode[], env: Environment): any {
        let result: any = null
        for (const stmt of statements) {
            result = this.execute(stmt, env)
        }
        return result
    }
    
    private execute(stmt: ASTNode, env: Environment): any {
        switch (stmt.type) {
            case 'VariableDeclaration':
                return this.visitVariableDeclaration(stmt as VariableDeclaration, env)
            case 'FunctionDeclaration':
                return this.visitFunctionDeclaration(stmt as FunctionDeclaration, env)
            case 'SayStatement':
                return this.visitSayStatement(stmt as SayStatement, env)
            case 'IfStatement':
                return this.visitIfStatement(stmt as IfStatement, env)
            case 'ExpressionStatement':
                return this.visitExpression(stmt as ExpressionStatement, env)
            case 'BlockStatement':
                return this.visitBlockStatement(stmt as BlockStatement, env)
            case 'ReturnStatement': {
                 const rs = stmt as ReturnStatement
                 let val = null
                 if (rs.argument) val = this.evaluateExpression(rs.argument, env)
                 throw new ReturnException(val)
            }
            default:
                throw new Error(`Unknown statement type: ${stmt.type}`)
        }
    }
    
    private visitVariableDeclaration(node: VariableDeclaration, env: Environment) {
        const value = this.evaluateExpression(node.value, env)
        
        if (node.pattern.type === 'Identifier') {
            env.define((node.pattern as Identifier).name, value)
        } else if (node.pattern.type === 'ObjectPattern') {
            // Assume value is object
            if (typeof value !== 'object' || value === null) throw new Error("Destructuring error: value is not an object")
            // @ts-ignore
            const safeValue = value as Record<string, any>;
            for (const prop of (node.pattern as ObjectPattern).properties) {
                // Assuming prop.key is the property name in the object and prop.value is the variable name
                env.define(prop.value, safeValue[prop.key])
            }
        } else if (node.pattern.type === 'ArrayPattern') {
            if (!Array.isArray(value)) throw new Error("Destructuring error: value is not an array")
            for (let i = 0; i < (node.pattern as ArrayPattern).elements.length; i++) {
                const variableName = (node.pattern as ArrayPattern).elements[i]
                if (i < value.length) {
                    env.define(variableName, value[i])
                } else {
                    env.define(variableName, undefined)
                }
            }
        } else {
            throw new Error(`Unsupported variable declaration pattern type: ${(node.pattern as any).type}`)
        }
        return value
    }
    
    private visitFunctionDeclaration(stmt: FunctionDeclaration, env: Environment) {
        env.define(stmt.name, {
            type: 'function',
            declaration: stmt,
            closure: env
        })
    }
    
    private visitSayStatement(stmt: SayStatement, env: Environment) {
        const value = this.evaluateExpression(stmt.argument, env)
        console.log(value)
        this.output.push(String(value))
    }
    
    private visitIfStatement(stmt: IfStatement, env: Environment) {
        const condition = this.evaluateExpression(stmt.test, env)
        if (this.isTruthy(condition)) {
            return this.execute(stmt.consequent, env) 
        } else if (stmt.alternate) {
            return this.execute(stmt.alternate, env)
        }
    }
    
    private visitBlockStatement(stmt: BlockStatement, env: Environment) {
        const newEnv = new Environment(env)
        return this.executeBlock(stmt.body, newEnv)
    }
    
    private visitExpression(stmt: ExpressionStatement, env: Environment) {
        return this.evaluateExpression(stmt.expression, env)
    }
    
    private evaluateExpression(expr: ASTNode, env: Environment): any {
        switch (expr.type) {
            case 'Literal':
                return (expr as Literal).value
            case 'Identifier':
                return env.get((expr as Identifier).name)
            case 'BinaryExpression':
                return this.visitBinaryExpression(expr as BinaryExpression, env)
            case 'CallExpression':
                return this.visitCallExpression(expr as CallExpression, env)
            case 'PipelineExpression': {
                const pipe = expr as PipelineExpression
                const leftVal = this.evaluateExpression(pipe.left, env)
                if (pipe.right.type === 'Identifier') {
                    const func = env.get((pipe.right as Identifier).name)
                    if (func && func.type === 'function') {
                        const funcDecl = func.declaration as FunctionDeclaration
                        if (funcDecl.params.length !== 1) {
                            throw new Error(`Function ${funcDecl.name} in pipeline expects 1 argument but got ${funcDecl.params.length}`)
                        }
                        const scope = new Environment(func.closure)
                        scope.define(funcDecl.params[0], leftVal)
                        // Handle implicit/explicit return
                        try {
                             return this.executeBlock(funcDecl.body.body, scope)
                        } catch (e: any) {
                             if (e instanceof ReturnException) return e.value
                             throw e
                        }
                    } else {
                        throw new Error(`'${(pipe.right as Identifier).name}' is not a function and cannot be used in a pipeline.`)
                    }
                }
                throw new Error("Pipeline right side must be a function identifier")
            }
            case 'RangeExpression': {
                const range = expr as RangeExpression
                const start = this.evaluateExpression(range.start, env)
                const end = this.evaluateExpression(range.end, env)
                const step = range.step ? this.evaluateExpression(range.step, env) : 1
                const result = []
                if (step > 0) {
                    for (let i = start; i <= end; i += step) result.push(i)
                } else if (step < 0) {
                    for (let i = start; i >= end; i += step) result.push(i)
                } else {
                    throw new Error("Range step cannot be zero.")
                }
                return result
            }
            case 'ArrayLiteral': {
                const arr = expr as ArrayLiteral
                return arr.elements.map(e => this.evaluateExpression(e, env))
            }
            case 'ObjectLiteral': {
                const obj = expr as ObjectLiteral
                const result: any = {}
                for (const prop of obj.properties) {
                    result[prop.key] = this.evaluateExpression(prop.value, env)
                }
                return result
            }
            case 'ListComprehension': {
                const comp = expr as ListComprehension
                const source = this.evaluateExpression(comp.source, env)
                if (!Array.isArray(source)) throw new Error("Comprehension source must be an array")
                
                const result = []
                const comprehensionEnv = new Environment(env)
                
                for (const item of source) {
                    comprehensionEnv.define(comp.element, item)
                    let include = true
                    if (comp.filter) {
                        include = this.evaluateExpression(comp.filter, comprehensionEnv)
                    }
                    if (include) {
                        result.push(this.evaluateExpression(comp.expression, comprehensionEnv))
                    }
                }
                return result
            }
            case 'FunctionExpression': {
                const funcExpr = expr as FunctionExpression
                return {
                    type: 'function',
                    declaration: funcExpr, // FunctionExpression structure matches what we need
                    closure: env
                }
            }
            default:
                throw new Error(`Unknown expression type: ${expr.type}`)
        }
    }
    
    private visitBinaryExpression(expr: BinaryExpression, env: Environment): any {
        const left = this.evaluateExpression(expr.left, env)
        const right = this.evaluateExpression(expr.right, env)
        
        switch (expr.operator) {
            case '+': return left + right
            case '-': return left - right
            case '*': return left * right
            case '/': return left / right
            case '>': return left > right
            case '<': return left < right
            default: throw new Error(`Unknown operator: ${expr.operator}`)
        }
    }
    
    private visitCallExpression(expr: CallExpression, env: Environment): any {
        const callee = env.get(expr.callee.name)
        
        if (callee && callee.type === 'function') {
            const func = callee.declaration as FunctionDeclaration
            const args = expr.arguments.map(arg => this.evaluateExpression(arg, env))
            
            if (args.length !== func.params.length) {
                throw new Error(`Function ${func.name} expects ${func.params.length} arguments but got ${args.length}`)
            }
            
            const scope = new Environment(callee.closure)
            for (let i = 0; i < func.params.length; i++) {
                scope.define(func.params[i], args[i])
            }
            
            // Execute body and return result (implicit return of last statement) or explicit return
            try {
                return this.executeBlock(func.body.body, scope) 
            } catch (e: any) {
                if (e instanceof ReturnException) {
                    return e.value
                }
                throw e
            } 
        }
        
        throw new Error(`'${expr.callee.name}' is not a function`)
    }

    private isTruthy(val: any): boolean {
        return !!val
    }
}
