
import { 
    Program, ASTNode, BinaryExpression, CallExpression, 
    FunctionDeclaration, Identifier, IfStatement, Literal, 
    VariableDeclaration, SayStatement, BlockStatement, ExpressionStatement
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
}

export class Interpreter {
    private globalEnv = new Environment()
    private output: string[] = [] // Capture output for testing

    constructor() {
        // Define native functions if needed
    }
    
    evaluate(program: Program): string[] {
        this.output = []
        try {
            this.executeBlock(program.body, this.globalEnv)
        } catch (e: any) {
            console.error("Runtime Error:", e.message)
            this.output.push(`Error: ${e.message}`)
        }
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
            default:
                throw new Error(`Unknown statement type: ${stmt.type}`)
        }
    }
    
    private visitVariableDeclaration(stmt: VariableDeclaration, env: Environment) {
        const value = this.evaluateExpression(stmt.value, env)
        env.define(stmt.name, value)
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
            
            // Execute body and return result (implicit return of last statement)
            return this.executeBlock(func.body.body, scope) 
        }
        
        throw new Error(`'${expr.callee.name}' is not a function`)
    }

    private isTruthy(val: any): boolean {
        return !!val
    }
}
