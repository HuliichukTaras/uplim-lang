import { 
    ASTNode, 
    Program, 
    VariableDeclaration, 
    FunctionDeclaration, 
    SayStatement, 
    IfStatement, 
    BlockStatement, 
    ExpressionStatement, 
    BinaryExpression, 
    CallExpression, 
    Literal, 
    Identifier,
    ObjectPattern,
    ArrayPattern
} from './parser'

export class Compiler {
    compile(program: Program): string {
        return this.compileBlock(program.body)
    }

    private compileBlock(statements: ASTNode[]): string {
        return statements.map(stmt => this.compileNode(stmt)).join('\n')
    }

    private compileNode(node: ASTNode): string {
        switch (node.type) {
            case 'VariableDeclaration': return this.compileVariableDeclaration(node as VariableDeclaration)
            case 'FunctionDeclaration': return this.compileFunctionDeclaration(node as FunctionDeclaration)
            case 'SayStatement': return this.compileSayStatement(node as SayStatement)
            case 'IfStatement': return this.compileIfStatement(node as IfStatement)
            case 'BlockStatement': return this.compileBlockStatement(node as BlockStatement)
            case 'ExpressionStatement': return this.compileExpressionStatement(node as ExpressionStatement)
            case 'BinaryExpression': return this.compileBinaryExpression(node as BinaryExpression)
            case 'CallExpression': return this.compileCallExpression(node as CallExpression)
            case 'Literal': return this.compileLiteral(node as Literal)
            case 'Identifier': return this.compileIdentifier(node as Identifier)
            default: throw new Error(`Unknown node type: ${node.type}`)
        }
    }

    private compileVariableDeclaration(node: VariableDeclaration): string {
        const val = this.compileNode(node.value)
        if (node.pattern.type === 'Identifier') {
            return `let ${node.pattern.name} = ${val};`
        } else if (node.pattern.type === 'ObjectPattern') {
            const props = node.pattern.properties.map(p => {
                return p.key === p.value ? p.key : `${p.key}: ${p.value}`
            }).join(', ')
            return `let { ${props} } = ${val};`
        } else if (node.pattern.type === 'ArrayPattern') {
            const elems = node.pattern.elements.join(', ')
            return `let [ ${elems} ] = ${val};`
        }
        return `// Unknown pattern type`
    }

    private compileFunctionDeclaration(node: FunctionDeclaration): string {
        const params = node.params.join(', ')
        const body = this.compileNode(node.body)
        return `function ${node.name}(${params}) ${body}`
    }

    private compileSayStatement(node: SayStatement): string {
        const arg = this.compileNode(node.argument)
        return `console.log(${arg});`
    }

    private compileIfStatement(node: IfStatement): string {
        const test = this.compileNode(node.test)
        const consequent = this.compileNode(node.consequent)
        let result = `if (${test}) ${consequent}`
        
        if (node.alternate) {
            const alternate = this.compileNode(node.alternate)
            result += ` else ${alternate}`
        }
        
        return result
    }

    private compileBlockStatement(node: BlockStatement): string {
        const body = this.compileBlock(node.body)
        return `{\n${body}\n}`
    }

    private compileExpressionStatement(node: ExpressionStatement): string {
        const expr = this.compileNode(node.expression)
        return `${expr};`
    }

    private compileBinaryExpression(node: BinaryExpression): string {
        const left = this.compileNode(node.left)
        const right = this.compileNode(node.right)
        return `${left} ${node.operator} ${right}`
    }

    private compileCallExpression(node: CallExpression): string {
        const callee = node.callee.name
        const args = node.arguments.map(arg => this.compileNode(arg)).join(', ')
        return `${callee}(${args})`
    }

    private compileLiteral(node: Literal): string {
        if (typeof node.value === 'string') {
            return `"${node.value}"`
        }
        return String(node.value)
    }

    private compileIdentifier(node: Identifier): string {
        return node.name
    }
}
