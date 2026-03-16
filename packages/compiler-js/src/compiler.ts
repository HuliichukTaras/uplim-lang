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
    UnaryExpression,
    CallExpression,
    Literal,
    Identifier,
    ObjectPattern,
    ArrayPattern,
    PipelineExpression,
    RangeExpression,
    ListComprehension,
    ArrayLiteral,
    ObjectLiteral,
    FunctionExpression,
    ReturnStatement,
    ForInStatement
} from 'uplim-frontend'

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
            case 'ForInStatement': return this.compileForInStatement(node as ForInStatement)
            case 'ExpressionStatement': return this.compileExpressionStatement(node as ExpressionStatement)
            case 'BinaryExpression': return this.compileBinaryExpression(node as BinaryExpression)
            case 'CallExpression': return this.compileCallExpression(node as CallExpression)
            case 'Literal': return this.compileLiteral(node as Literal)
            case 'Identifier': return this.compileIdentifier(node as Identifier)
            case 'UnaryExpression': return this.compileUnaryExpression(node as UnaryExpression)
            case 'PipelineExpression': return this.compilePipelineExpression(node as PipelineExpression)
            case 'RangeExpression': return this.compileRangeExpression(node as RangeExpression)
            case 'ListComprehension': return this.compileListComprehension(node as ListComprehension)
            case 'ArrayLiteral': return this.compileArrayLiteral(node as ArrayLiteral)
            case 'ObjectLiteral': return this.compileObjectLiteral(node as ObjectLiteral)
            case 'FunctionExpression': return this.compileFunctionExpression(node as FunctionExpression)
            case 'ReturnStatement': return this.compileReturnStatement(node as ReturnStatement)
            default: throw new Error(`Unknown node type: ${node.type}`)
        }
    }

    private compileVariableDeclaration(node: VariableDeclaration): string {
        const val = this.compileNode(node.value)
        const declarationKind = node.kind === 'const' ? 'const' : 'let'
        if (node.pattern.type === 'Identifier') {
            return `${declarationKind} ${node.pattern.name} = ${val};`
        } else if (node.pattern.type === 'ObjectPattern') {
            const props = node.pattern.properties.map(p => {
                return p.key === p.value ? p.key : `${p.key}: ${p.value}`
            }).join(', ')
            return `${declarationKind} { ${props} } = ${val};`
        } else if (node.pattern.type === 'ArrayPattern') {
            const elems = node.pattern.elements.join(', ')
            return `${declarationKind} [ ${elems} ] = ${val};`
        }
        return `// Unknown pattern type`
    }

    private compileFunctionDeclaration(node: FunctionDeclaration): string {
        const params = node.params.map(param => param.name).join(', ')
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

    private compileForInStatement(node: ForInStatement): string {
        const source = this.compileNode(node.source)
        const body = this.compileNode(node.body)
        return `for (const ${node.iterator} of ${source}) ${body}`
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
        const callee = this.compileNode(node.callee)
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

    private compileUnaryExpression(node: UnaryExpression): string {
        const argument = this.compileNode(node.argument)
        return `${node.operator}${argument}`
    }

    private compileReturnStatement(node: ReturnStatement): string {
        if (node.argument) {
            return `return ${this.compileNode(node.argument)};`
        }
        return 'return;'
    }

    private compileFunctionExpression(node: FunctionExpression): string {
        const params = node.params.join(', ')
        const body = this.compileNode(node.body)
        const name = node.name ? node.name : ''
        return `function ${name}(${params}) ${body}`
    }

    private compilePipelineExpression(node: PipelineExpression): string {
        const left = this.compileNode(node.left)
        const right = this.compileNode(node.right)
        return `${right}(${left})`
    }

    private compileRangeExpression(node: RangeExpression): string {
        const start = this.compileNode(node.start)
        const end = this.compileNode(node.end)
        const step = node.step ? this.compileNode(node.step) : '1'
        return `(() => { const r = []; const __start = ${start}; const __end = ${end}; const __step = ${step}; if (__step === 0) throw new Error("Range step cannot be zero."); if (__step > 0) { for (let i = __start; i <= __end; i += __step) r.push(i); } else { for (let i = __start; i >= __end; i += __step) r.push(i); } return r; })()`
    }

    private compileListComprehension(node: ListComprehension): string {
        // source must be array
        const source = this.compileNode(node.source)
        const element = node.element
        
        let result = `${source}`
        if (node.filter) {
            // Need to handle scope/variable binding? In JS filter(e => ...) works
            // But we need to bind 'element' to the argument
            // Uplim: [ x*2 | x in list ] -> list.map(x => x*2)
            // Uplim: [ x | x in list, x > 5 ] -> list.filter(x => x > 5).map(x => x)
            
            // We need to temporarily set the compile context?
            // Actually, for simple expression compilation, replacing the identifier usage in expression with argument name is tough without scope analysis.
            // BUT, since JS arrow functions use correct scoping, we can just use the element name as the arrow arg.
             const filterBody = this.compileNode(node.filter)
             result += `.filter(${element} => ${filterBody})`
        }
        
        const mapBody = this.compileNode(node.expression)
        result += `.map(${element} => ${mapBody})`
        
        return result
    }

    private compileArrayLiteral(node: ArrayLiteral): string {
        const elements = node.elements.map(e => this.compileNode(e)).join(', ')
        return `[${elements}]`
    }

    private compileObjectLiteral(node: ObjectLiteral): string {
        const props = node.properties.map(p => {
             return `${p.key}: ${this.compileNode(p.value)}`
        }).join(', ')
        return `{ ${props} }`
    }
}
