export class UPLimInterpreter {
  private variables: Map<string, any> = new Map();
  private output: string[] = [];

  interpret(code: string): string {
    this.output = [];
    this.variables.clear();

    const lines = code.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        this.executeLine(line.trim());
      } catch (error) {
        this.output.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return this.output.join('\n');
  }

  private executeLine(line: string): void {
    // Variable declaration: let x = 10 or let x be 10
    if (line.startsWith('let ')) {
      const match = line.match(/let\s+(\w+)\s+(?:=|be)\s+(.+)/);
      if (match) {
        const [, name, value] = match;
        this.variables.set(name, this.evaluateExpression(value));
        return;
      }
    }

    // Print statement: say "hello" or say x
    if (line.startsWith('say ')) {
      const content = line.substring(4);
      const result = this.evaluateExpression(content);
      this.output.push(String(result));
      return;
    }

    // Conditional: when x > 5 do
    if (line.startsWith('when ')) {
      // Simple when...do handling (single line for now)
      const match = line.match(/when\s+(.+)\s+do\s+(.+)/);
      if (match) {
        const [, condition, action] = match;
        if (this.evaluateCondition(condition)) {
          this.executeLine(action);
        }
      }
      return;
    }
  }

  private evaluateExpression(expr: string): any {
    expr = expr.trim();

    // String literal
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr.slice(1, -1);
    }

    // Number literal
    if (/^-?\d+(\.\d+)?$/.test(expr)) {
      return parseFloat(expr);
    }

    // Boolean literal
    if (expr === 'true') return true;
    if (expr === 'false') return false;

    // String concatenation: "hello" plus name
    if (expr.includes(' plus ')) {
      const parts = expr.split(' plus ');
      return parts.map(p => this.evaluateExpression(p.trim())).join('');
    }

    // Arithmetic: 10 + 5, x * 2
    if (expr.includes('+')) {
      const parts = expr.split('+');
      return parts.reduce((sum, p) => sum + this.evaluateExpression(p.trim()), 0);
    }
    if (expr.includes('-') && !expr.startsWith('-')) {
      const parts = expr.split('-');
      const first = this.evaluateExpression(parts[0].trim());
      return parts.slice(1).reduce((result, p) => result - this.evaluateExpression(p.trim()), first);
    }
    if (expr.includes('*')) {
      const parts = expr.split('*');
      return parts.reduce((product, p) => product * this.evaluateExpression(p.trim()), 1);
    }
    if (expr.includes('/')) {
      const parts = expr.split('/');
      const first = this.evaluateExpression(parts[0].trim());
      return parts.slice(1).reduce((result, p) => result / this.evaluateExpression(p.trim()), first);
    }

    // Variable reference
    if (this.variables.has(expr)) {
      return this.variables.get(expr);
    }

    // Unknown expression
    return expr;
  }

  private evaluateCondition(condition: string): boolean {
    condition = condition.trim();

    // equals: x equals 10
    if (condition.includes(' equals ')) {
      const [left, right] = condition.split(' equals ');
      return this.evaluateExpression(left) == this.evaluateExpression(right);
    }

    // greater than: x greater than 5
    if (condition.includes(' greater than ')) {
      const [left, right] = condition.split(' greater than ');
      return this.evaluateExpression(left) > this.evaluateExpression(right);
    }

    // less than: x less than 5
    if (condition.includes(' less than ')) {
      const [left, right] = condition.split(' less than ');
      return this.evaluateExpression(left) < this.evaluateExpression(right);
    }

    // Comparison operators
    if (condition.includes('==')) {
      const [left, right] = condition.split('==');
      return this.evaluateExpression(left) == this.evaluateExpression(right);
    }
    if (condition.includes('>')) {
      const [left, right] = condition.split('>');
      return this.evaluateExpression(left) > this.evaluateExpression(right);
    }
    if (condition.includes('<')) {
      const [left, right] = condition.split('<');
      return this.evaluateExpression(left) < this.evaluateExpression(right);
    }

    return false;
  }
}

// Export a singleton instance
export const uplimInterpreter = new UPLimInterpreter();
