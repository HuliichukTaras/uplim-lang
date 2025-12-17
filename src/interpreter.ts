
import { 
    Parser, ASTNode, Program, Expression, Statement, 
    VariableDeclaration, FunctionDeclaration, IfStatement, ReturnStatement,
    BinaryExpression, UnaryExpression, CallExpression, Literal, Identifier,
    BlockStatement, WhileStatement, AssignmentExpression,
    StructDeclaration, EnumDeclaration, ModelDeclaration, ImportDeclaration,
    AwaitExpression, SayStatement, ExpressionStatement,
    PipelineExpression, RangeExpression, ListComprehension,
    ArrayLiteral, ObjectLiteral, ObjectPattern, ArrayPattern,
    FunctionExpression, MemberExpression
} from './parser'
import { Lexer } from './lexer'
import * as http from 'http'
import * as fs from 'fs'
import * as path from 'path'

export class Environment {
    public values = new Map<string, any>() // Made public
    public exports = new Map<string, any>() // Exported values
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

    private moduleCache = new Map<string, Environment>()

    constructor() {
        // Define native functions
        this.globalEnv.define('read_file', {
            type: 'native_function',
            call: (args: any[], env: Environment) => {
                 if (args.length !== 1) throw new Error("read_file(path) expects 1 argument")
                 const p = args[0]
                 if (typeof p !== 'string') throw new Error("read_file: path must be string")
                 return fs.readFileSync(p, 'utf-8')
            }
        })
        this.globalEnv.define('serve', {
            type: 'native_function',
            call: (args: any[], env: Environment) => {
                if (args.length !== 2) throw new Error("serve(port, handler) expects 2 arguments")
                const port = args[0]
                const handler = args[1] // Function object
                
                if (typeof port !== 'number') throw new Error("serve: port must be a number")
                
                // We're inside a sync execution, but server is async. 
                // UPLim CLI will likely exit if we don't keep event loop alive.
                // createServer keeps it alive.
                
                const server = http.createServer((req, res) => {
                     // Prepare request object for UPLim
                     const reqObj = {
                         method: req.method || 'GET',
                         url: req.url || '/',
                         headers: req.headers
                     }
                     
                     // Helper to send response
                     const sendResponse = (body: string, status = 200) => {
                         res.writeHead(status, { 'Content-Type': 'text/html' })
                         res.end(body)
                     }
                     
                     try {
                         // Call the UPLim handler function
                         // We need to re-use the visitCallExpression logic or manually call it.
                         // But we are in a callback, providing 'handler' logic.
                         
                         if (handler.type !== 'function') {
                             throw new Error("serve: handler must be a function")
                         }
                         
                         const funcDecl = handler.declaration as FunctionDeclaration
                         if (funcDecl.params.length !== 1) {
                             // Handler should accept (request)
                             throw new Error("serve: handler function must accept 1 argument (request)")
                         }
                         
                         const scope = new Environment(handler.closure)
                         scope.define(funcDecl.params[0].name, reqObj)
                         
                         // Execute body
                         let result = ""
                         try {
                              // We need access to 'this.executeBlock', but 'this' is Interpreter instance.
                              // We are inside arrow function so 'this' is preserved.
                              // CAUTION: 'executeBlock' is private. But we are inside the class.
                              result = this.executeBlock(funcDecl.body.body, scope)
                         } catch (e: any) {
                              if (e instanceof ReturnException) {
                                  result = e.value
                              } else {
                                  throw e
                              }
                         }
                         
                         sendResponse(String(result))
                         
                     } catch (e: any) {
                         console.error("Handler error:", e)
                         sendResponse("Internal Server Error: " + e.message, 500)
                     }
                })
                
                server.listen(port, () => {
                    console.log(`UPLim Server running on http://localhost:${port}`)
                })
                
                return "Server started"
            }
        })
    }
    
    evaluate(program: Program): string[] {
        this.output = []
        this.executeBlock(program.body, this.globalEnv)
        
        // Auto-run main if exists
        try {
            const mainFn = this.globalEnv.get('main')
            if (mainFn && mainFn.type === 'function') {
                const funcDecl = mainFn.declaration as FunctionDeclaration
                // Assume main() takes no args for now
                const scope = new Environment(mainFn.closure)
                try {
                    this.executeBlock(funcDecl.body.body, scope)
                } catch (e: any) {
                    if (!(e instanceof ReturnException)) throw e
                }
            }
        } catch (e) {
            // main not defined, ignore
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
    
    private loadModule(source: string): Environment {
        // Mock standard/custom modules for v0.1 tests
        if (source === 'math' || source === 'std.math' || source.startsWith('ai.')) {
            const mockEnv = new Environment()
            // Add mock exports if needed
            return mockEnv
        }

        let resolvedPath = source
        // Simple resolution strategy for v0.3
        if (source.startsWith('@/')) {
            resolvedPath = path.resolve(process.cwd(), source.replace('@/', ''))
        } else {
            resolvedPath = path.resolve(process.cwd(), source)
        }

        if (!fs.existsSync(resolvedPath) && fs.existsSync(resolvedPath + '.upl')) {
            resolvedPath += '.upl'
        }

        if (this.moduleCache.has(resolvedPath)) {
            return this.moduleCache.get(resolvedPath)!
        }

        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`Module not found: ${source} (checked: ${resolvedPath})`)
        }

        const code = fs.readFileSync(resolvedPath, 'utf-8')
        const moduleEnv = new Environment(this.globalEnv)
        this.moduleCache.set(resolvedPath, moduleEnv)

        // const lexer = new Lexer(code) // Parser handles lexing
        const parser = new Parser()
        const result = parser.parse(code, resolvedPath)
        console.log("Parsed module:", source, "Errors:", result.errors.length)
        
        if (result.errors.length > 0) {
            throw new Error(`Parse error in module ${source}: ${result.errors[0].message}`)
        }

        for (const stmt of result.ast.body) {
            this.execute(stmt, moduleEnv)
        }

        return moduleEnv
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
            case 'WhileStatement':
                return this.visitWhileStatement(stmt as WhileStatement, env)
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
            case 'StructDeclaration':
            case 'EnumDeclaration':
            case 'ModelDeclaration':
                return null // Ignore declarations for now
            case 'ImportDeclaration': {
                const importDecl = stmt as ImportDeclaration
                
                // v0.1: Simple import "module" -> creates variable "module"
                const moduleName = importDecl.source
                const moduleEnv = this.loadModule(moduleName)
                
                // Derive variable name from module path
                // e.g. "std.math" -> "math"
                // e.g. "ai.gpt" -> "gpt"
                const parts = moduleName.split('.')
                const name = parts[parts.length - 1]
                
                // Define the module environment as a value in the current scope
                // This assumes MemberExpression logic can handle Environment objects
                // OR we'll wrap it in a way the interpreter understands.
                // For now, let's treat it as a native internal object.
                env.define(name, moduleEnv) // Changed this.currentEnv to env
                return null
            }
            // ExportDeclaration removed
            // case 'ExportDeclaration': ...
            default:
                throw new Error(`Unknown statement type: ${(stmt as any).type}`)

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

    private visitWhileStatement(stmt: WhileStatement, env: Environment) {
        while (this.isTruthy(this.evaluateExpression(stmt.test, env))) {
            this.execute(stmt.body, env)
        }
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
                        scope.define(funcDecl.params[0].name, leftVal)
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
            case 'MemberExpression': {
                const member = expr as MemberExpression
                const object = this.evaluateExpression(member.object, env)
                const property = member.property.name
                
                if (object === undefined || object === null) {
                    throw new Error(`Cannot access property '${property}' of ${object}`)
                }
                
                // Allow accessing properties of JS objects (like our reqObj)
                if (typeof object === 'object') {
                    const val = object[property]
                    // If it's a method on a native object (like array.push), we might want to bind it?
                    // For simple POJO (reqObj), just return value.
                    return val
                }
                throw new Error(`Cannot access property '${property}' on non-object`)
            }
            case 'AssignmentExpression': {
                const assign = expr as AssignmentExpression
                const value = this.evaluateExpression(assign.right, env)
                
                if (assign.left.type === 'Identifier') {
                    env.assign((assign.left as Identifier).name, value)
                    return value
                } else if (assign.left.type === 'MemberExpression') {
                    const member = assign.left as MemberExpression
                    const obj = this.evaluateExpression(member.object, env)
                    if (typeof obj !== 'object' || obj === null) throw new Error("Assignment to property of non-object")
                    obj[member.property.name] = value
                    return value
                }
                
                throw new Error("Invalid assignment target")
            }
            case 'IfStatement': {
                 // If Expression support
                 return this.visitIfStatement(expr as IfStatement, env)
            }
            case 'AwaitExpression': {
                 const awaitExpr = expr as AwaitExpression
                 // Mock async: just evaluate argument
                 return this.evaluateExpression(awaitExpr.argument, env)
            }
            default:
                throw new Error(`Unknown expression type: ${(expr as any).type}`)
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
        // Evaluate callee expression 
        // Previously assumed callee was Identifier
        
        let callee
        if (expr.callee.type === 'Identifier') {
             callee = env.get((expr.callee as Identifier).name)
        } else {
             callee = this.evaluateExpression(expr.callee, env)
        }
        
        if (callee && callee.type === 'native_function') {
             return callee.call(expr.arguments.map(arg => this.evaluateExpression(arg, env)), env)
        }

        if (callee && callee.type === 'function') {
            const func = callee.declaration as FunctionDeclaration
            const args = expr.arguments.map(arg => this.evaluateExpression(arg, env))
            
            if (args.length !== func.params.length) {
                throw new Error(`Function ${func.name || 'anonymous'} expects ${func.params.length} arguments but got ${args.length}`)
            }
            
            const scope = new Environment(callee.closure)
            for (let i = 0; i < func.params.length; i++) {
                scope.define(func.params[i].name, args[i])
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
        
        throw new Error(`'${expr.callee.type === 'Identifier' ? (expr.callee as Identifier).name : 'Expression'}' is not a function`)
    }

    private isTruthy(val: any): boolean {
        return !!val
    }
}
