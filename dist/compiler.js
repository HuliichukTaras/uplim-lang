"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Compiler = void 0;
class Compiler {
    compile(program) {
        return this.compileBlock(program.body);
    }
    compileBlock(statements) {
        return statements.map(stmt => this.compileNode(stmt)).join('\n');
    }
    compileNode(node) {
        switch (node.type) {
            case 'VariableDeclaration': return this.compileVariableDeclaration(node);
            case 'FunctionDeclaration': return this.compileFunctionDeclaration(node);
            case 'SayStatement': return this.compileSayStatement(node);
            case 'IfStatement': return this.compileIfStatement(node);
            case 'BlockStatement': return this.compileBlockStatement(node);
            case 'ExpressionStatement': return this.compileExpressionStatement(node);
            case 'BinaryExpression': return this.compileBinaryExpression(node);
            case 'CallExpression': return this.compileCallExpression(node);
            case 'Literal': return this.compileLiteral(node);
            case 'Identifier': return this.compileIdentifier(node);
            default: throw new Error(`Unknown node type: ${node.type}`);
        }
    }
    compileVariableDeclaration(node) {
        const val = this.compileNode(node.value);
        if (node.pattern.type === 'Identifier') {
            return `let ${node.pattern.name} = ${val};`;
        }
        else if (node.pattern.type === 'ObjectPattern') {
            const props = node.pattern.properties.map(p => {
                return p.key === p.value ? p.key : `${p.key}: ${p.value}`;
            }).join(', ');
            return `let { ${props} } = ${val};`;
        }
        else if (node.pattern.type === 'ArrayPattern') {
            const elems = node.pattern.elements.join(', ');
            return `let [ ${elems} ] = ${val};`;
        }
        return `// Unknown pattern type`;
    }
    compileFunctionDeclaration(node) {
        const params = node.params.join(', ');
        const body = this.compileNode(node.body);
        return `function ${node.name}(${params}) ${body}`;
    }
    compileSayStatement(node) {
        const arg = this.compileNode(node.argument);
        return `console.log(${arg});`;
    }
    compileIfStatement(node) {
        const test = this.compileNode(node.test);
        const consequent = this.compileNode(node.consequent);
        let result = `if (${test}) ${consequent}`;
        if (node.alternate) {
            const alternate = this.compileNode(node.alternate);
            result += ` else ${alternate}`;
        }
        return result;
    }
    compileBlockStatement(node) {
        const body = this.compileBlock(node.body);
        return `{\n${body}\n}`;
    }
    compileExpressionStatement(node) {
        const expr = this.compileNode(node.expression);
        return `${expr};`;
    }
    compileBinaryExpression(node) {
        const left = this.compileNode(node.left);
        const right = this.compileNode(node.right);
        return `${left} ${node.operator} ${right}`;
    }
    compileCallExpression(node) {
        const callee = node.callee.name;
        const args = node.arguments.map(arg => this.compileNode(arg)).join(', ');
        return `${callee}(${args})`;
    }
    compileLiteral(node) {
        if (typeof node.value === 'string') {
            return `"${node.value}"`;
        }
        return String(node.value);
    }
    compileIdentifier(node) {
        return node.name;
    }
}
exports.Compiler = Compiler;
