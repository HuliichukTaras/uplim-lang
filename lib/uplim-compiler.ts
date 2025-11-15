// UPLim Compiler Core - Simple Mode & Compact Mode
export type Token = {
  type: 'keyword' | 'identifier' | 'number' | 'string' | 'operator' | 'punctuation';
  value: string;
  line: number;
  column: number;
};

export type ASTNode = {
  type: string;
  value?: any;
  children?: ASTNode[];
  metadata?: Record<string, any>;
};

export class UPLimCompiler {
  private mode: 'simple' | 'compact';
  
  constructor(mode: 'simple' | 'compact' = 'simple') {
    this.mode = mode;
  }

  tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    const lines = code.split('\n');
    
    const keywords = ['let', 'say', 'when', 'do', 'make', 'be', 'plus', 'minus', 'times', 'divided'];
    
    lines.forEach((line, lineNum) => {
      const words = line.trim().split(/\s+/);
      let column = 0;
      
      words.forEach(word => {
        if (keywords.includes(word)) {
          tokens.push({ type: 'keyword', value: word, line: lineNum, column });
        } else if (/^\d+$/.test(word)) {
          tokens.push({ type: 'number', value: word, line: lineNum, column });
        } else if (word.startsWith('"') || word.startsWith("'")) {
          tokens.push({ type: 'string', value: word, line: lineNum, column });
        } else if (word) {
          tokens.push({ type: 'identifier', value: word, line: lineNum, column });
        }
        column += word.length + 1;
      });
    });
    
    return tokens;
  }

  parse(tokens: Token[]): ASTNode {
    const ast: ASTNode = {
      type: 'Program',
      children: []
    };

    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];
      
      if (token.type === 'keyword') {
        switch (token.value) {
          case 'let':
            const varNode = this.parseVariableDeclaration(tokens, i);
            ast.children?.push(varNode.node);
            i = varNode.nextIndex;
            break;
          case 'say':
            const printNode = this.parsePrint(tokens, i);
            ast.children?.push(printNode.node);
            i = printNode.nextIndex;
            break;
          case 'when':
            const condNode = this.parseConditional(tokens, i);
            ast.children?.push(condNode.node);
            i = condNode.nextIndex;
            break;
          default:
            i++;
        }
      } else {
        i++;
      }
    }

    return ast;
  }

  private parseVariableDeclaration(tokens: Token[], start: number) {
    // let x = 10 or let x be 10
    const node: ASTNode = {
      type: 'VariableDeclaration',
      children: []
    };
    
    let i = start + 1;
    if (i < tokens.length) {
      node.value = tokens[i].value; // variable name
      i++; // skip '=' or 'be'
      if (i < tokens.length && (tokens[i].value === '=' || tokens[i].value === 'be')) {
        i++;
      }
      if (i < tokens.length) {
        node.metadata = { initialValue: tokens[i].value };
      }
    }
    
    return { node, nextIndex: i + 1 };
  }

  private parsePrint(tokens: Token[], start: number) {
    const node: ASTNode = {
      type: 'PrintStatement',
      children: []
    };
    
    let i = start + 1;
    while (i < tokens.length && tokens[i].type !== 'keyword') {
      node.children?.push({
        type: 'Literal',
        value: tokens[i].value
      });
      i++;
    }
    
    return { node, nextIndex: i };
  }

  private parseConditional(tokens: Token[], start: number) {
    const node: ASTNode = {
      type: 'ConditionalStatement',
      children: []
    };
    
    // Simple parsing for demonstration
    return { node, nextIndex: start + 1 };
  }

  compile(code: string): string {
    const tokens = this.tokenize(code);
    const ast = this.parse(tokens);
    return this.generateCode(ast);
  }

  private generateCode(ast: ASTNode): string {
    let output = '';
    
    ast.children?.forEach(node => {
      switch (node.type) {
        case 'VariableDeclaration':
          output += `let ${node.value} = ${node.metadata?.initialValue};\n`;
          break;
        case 'PrintStatement':
          const values = node.children?.map(c => c.value).join(' ') || '';
          output += `console.log(${values});\n`;
          break;
      }
    });
    
    return output;
  }

  execute(code: string): string {
    try {
      const tokens = this.tokenize(code);
      const ast = this.parse(tokens);
      
      // Simple interpreter
      let output = '';
      ast.children?.forEach(node => {
        if (node.type === 'PrintStatement') {
          const text = node.children?.map(c => c.value.replace(/['"]/g, '')).join(' ') || '';
          output += text + '\n';
        }
      });
      
      return output || 'Program executed successfully';
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
