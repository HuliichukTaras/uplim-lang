
export enum TokenType {
  // Keywords
  Let = 'Let',
  Make = 'Make', 
  When = 'When',
  Do = 'Do',
  Else = 'Else',
  Say = 'Say',
  Return = 'Return',
  Import = 'Import',
  Export = 'Export',
  Type = 'Type',
  True = 'True',
  False = 'False',
  Null = 'Null',
  
  // Identifiers & Literals
  Identifier = 'Identifier',
  String = 'String',
  Number = 'Number',
  
  // Operators
  Equals = 'Equals', // =
  Plus = 'Plus', // +
  Minus = 'Minus', // -
  Multiply = 'Multiply', // *
  Divide = 'Divide', // /
  Arrow = 'Arrow', // =>
  GreaterThan = 'GreaterThan', // >
  LessThan = 'LessThan', // <
  Dot = 'Dot', // .
  Comma = 'Comma', // ,
  Colon = 'Colon', // :
  
  // Grouping
  LParen = 'LParen', // (
  RParen = 'RParen', // )
  LBrace = 'LBrace', // {
  RBrace = 'RBrace', // }
  LBracket = 'LBracket', // [
  RBracket = 'RBracket', // ]
  
  // Special
  EOF = 'EOF',
  Unknown = 'Unknown'
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export class Lexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    let token = this.nextToken();
    
    while (token.type !== TokenType.EOF) {
      tokens.push(token);
      token = this.nextToken();
    }
    
    tokens.push(token); // Push EOF
    return tokens;
  }

  private nextToken(): Token {
    this.skipWhitespace();

    if (this.position >= this.source.length) {
      return this.createToken(TokenType.EOF, '');
    }

    const char = this.peek();

    // Identifiers & Keywords
    if (this.isAlpha(char)) {
      const start = this.position;
      while (this.isAlphaNumeric(this.peek())) {
        this.advance();
      }
      const value = this.source.slice(start, this.position);
      return this.createToken(this.getKeywordType(value), value);
    }

    // Numbers
    if (this.isDigit(char)) {
      const start = this.position;
      while (this.isDigit(this.peek())) {
        this.advance();
      }
      return this.createToken(TokenType.Number, this.source.slice(start, this.position));
    }

    // Strings
    if (char === '"') {
        this.advance(); // skip quote
        const start = this.position;
        while (this.peek() !== '"' && this.peek() !== '') {
            this.advance();
        }
        const value = this.source.slice(start, this.position);
        this.advance(); // skip closing quote
        return this.createToken(TokenType.String, value);
    }

    // Operators & Punctuation
    this.advance();
    switch (char) {
      case '=':
        if (this.peek() === '>') {
            this.advance();
            return this.createToken(TokenType.Arrow, '=>');
        }
        return this.createToken(TokenType.Equals, '=');
      case '+': return this.createToken(TokenType.Plus, '+');
      case '-': return this.createToken(TokenType.Minus, '-');
      case '*': return this.createToken(TokenType.Multiply, '*');
      case '/': return this.createToken(TokenType.Divide, '/');
      case '(': return this.createToken(TokenType.LParen, '(');
      case ')': return this.createToken(TokenType.RParen, ')');
      case '{': return this.createToken(TokenType.LBrace, '{');
      case '}': return this.createToken(TokenType.RBrace, '}');
      case '[': return this.createToken(TokenType.LBracket, '[');
      case ']': return this.createToken(TokenType.RBracket, ']');
      case ',': return this.createToken(TokenType.Comma, ',');
      case '.': return this.createToken(TokenType.Dot, '.');
      case ':': return this.createToken(TokenType.Colon, ':');
      case '>': return this.createToken(TokenType.GreaterThan, '>');
      case '<': return this.createToken(TokenType.LessThan, '<');
      default: return this.createToken(TokenType.Unknown, char);
    }
  }

  private createToken(type: TokenType, value: string): Token {
    return { type, value, line: this.line, column: this.column - value.length };
  }

  private advance(): string {
    const char = this.source[this.position++];
    this.column++;
    if (char === '\n') {
        this.line++;
        this.column = 1;
    }
    return char;
  }

  private peek(): string {
    return this.position < this.source.length ? this.source[this.position] : '';
  }

  private skipWhitespace() {
    while (/\s/.test(this.peek())) {
      this.advance();
    }
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return /[a-zA-Z0-9_]/.test(char);
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private getKeywordType(identifier: string): TokenType {
    switch (identifier) {
      case 'let': return TokenType.Let;
      case 'make': return TokenType.Make;
      case 'func': return TokenType.Make; // Alias
      case 'when': return TokenType.When;
      case 'do': return TokenType.Do;
      case 'say': return TokenType.Say;
      case 'else': return TokenType.Else;
      case 'return': return TokenType.Return;
      case 'true': return TokenType.True;
      case 'false': return TokenType.False;
      case 'null': return TokenType.Null;
      case 'type': return TokenType.Type;
      case 'import': return TokenType.Import;
      case 'export': return TokenType.Export;
      default: return TokenType.Identifier;
    }
  }
}
