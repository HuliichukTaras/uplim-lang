// UPLim Type System Implementation

export type UPLimType =
  | { kind: 'primitive'; name: 'Int' | 'Float' | 'Bool' | 'Char' | 'String' | 'Unit' | 'Never' }
  | { kind: 'tuple'; elements: UPLimType[] }
  | { kind: 'array'; element: UPLimType; size?: number }
  | { kind: 'record'; fields: Map<string, UPLimType> }
  | { kind: 'sum'; variants: Map<string, UPLimType[]> }
  | { kind: 'generic'; name: string; constraints: string[] }
  | { kind: 'function'; params: UPLimType[]; return: UPLimType }
  | { kind: 'reference'; mutable: boolean; inner: UPLimType; lifetime?: string };

export interface TypeEnvironment {
  bindings: Map<string, UPLimType>;
  parent?: TypeEnvironment;
}

export class TypeChecker {
  private env: TypeEnvironment;

  constructor() {
    this.env = { bindings: new Map() };
  }

  inferType(expr: any): UPLimType {
    switch (expr.type) {
      case 'IntLiteral':
        return { kind: 'primitive', name: 'Int' };
      case 'FloatLiteral':
        return { kind: 'primitive', name: 'Float' };
      case 'BoolLiteral':
        return { kind: 'primitive', name: 'Bool' };
      case 'StringLiteral':
        return { kind: 'primitive', name: 'String' };
      case 'Variable':
        return this.lookup(expr.name);
      case 'FunctionCall':
        return this.inferFunctionCall(expr);
      case 'BinaryOp':
        return this.inferBinaryOp(expr);
      default:
        throw new Error(`Cannot infer type for ${expr.type}`);
    }
  }

  checkType(expr: any, expected: UPLimType): boolean {
    const actual = this.inferType(expr);
    return this.typesMatch(actual, expected);
  }

  private typesMatch(a: UPLimType, b: UPLimType): boolean {
    if (a.kind !== b.kind) return false;
    
    switch (a.kind) {
      case 'primitive':
        return a.name === (b as any).name;
      case 'tuple':
        const bTuple = b as Extract<UPLimType, { kind: 'tuple' }>;
        return a.elements.length === bTuple.elements.length &&
               a.elements.every((t, i) => this.typesMatch(t, bTuple.elements[i]));
      case 'array':
        const bArray = b as Extract<UPLimType, { kind: 'array' }>;
        return this.typesMatch(a.element, bArray.element);
      case 'function':
        const bFunc = b as Extract<UPLimType, { kind: 'function' }>;
        return a.params.length === bFunc.params.length &&
               a.params.every((p, i) => this.typesMatch(p, bFunc.params[i])) &&
               this.typesMatch(a.return, bFunc.return);
      default:
        return false;
    }
  }

  private lookup(name: string): UPLimType {
    let current: TypeEnvironment | undefined = this.env;
    while (current) {
      const type = current.bindings.get(name);
      if (type) return type;
      current = current.parent;
    }
    throw new Error(`Undefined variable: ${name}`);
  }

  private inferFunctionCall(expr: any): UPLimType {
    const fnType = this.inferType(expr.function);
    if (fnType.kind !== 'function') {
      throw new Error('Not a function');
    }
    return fnType.return;
  }

  private inferBinaryOp(expr: any): UPLimType {
    const left = this.inferType(expr.left);
    const right = this.inferType(expr.right);
    
    if (!this.typesMatch(left, right)) {
      throw new Error('Type mismatch in binary operation');
    }
    
    return left;
  }

  bind(name: string, type: UPLimType): void {
    this.env.bindings.set(name, type);
  }

  enterScope(): void {
    this.env = { bindings: new Map(), parent: this.env };
  }

  exitScope(): void {
    if (this.env.parent) {
      this.env = this.env.parent;
    }
  }
}
