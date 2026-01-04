"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    // Keywords
    TokenType["Let"] = "Let";
    TokenType["Make"] = "Make";
    TokenType["When"] = "When";
    TokenType["Do"] = "Do";
    TokenType["Else"] = "Else";
    TokenType["Say"] = "Say";
    TokenType["Return"] = "Return";
    TokenType["Import"] = "Import";
    TokenType["Export"] = "Export";
    TokenType["Type"] = "Type";
    TokenType["True"] = "True";
    TokenType["False"] = "False";
    TokenType["Null"] = "Null";
    // Identifiers & Literals
    TokenType["Identifier"] = "Identifier";
    TokenType["String"] = "String";
    TokenType["Number"] = "Number";
    // Operators
    TokenType["Equals"] = "Equals";
    TokenType["Plus"] = "Plus";
    TokenType["Minus"] = "Minus";
    TokenType["Multiply"] = "Multiply";
    TokenType["Divide"] = "Divide";
    TokenType["Arrow"] = "Arrow";
    TokenType["GreaterThan"] = "GreaterThan";
    TokenType["LessThan"] = "LessThan";
    TokenType["Dot"] = "Dot";
    TokenType["Comma"] = "Comma";
    TokenType["Colon"] = "Colon";
    // Grouping
    TokenType["LParen"] = "LParen";
    TokenType["RParen"] = "RParen";
    TokenType["LBrace"] = "LBrace";
    TokenType["RBrace"] = "RBrace";
    TokenType["LBracket"] = "LBracket";
    TokenType["RBracket"] = "RBracket";
    // Special
    TokenType["EOF"] = "EOF";
    TokenType["Unknown"] = "Unknown";
})(TokenType || (exports.TokenType = TokenType = {}));
class Lexer {
    source;
    position = 0;
    line = 1;
    column = 1;
    constructor(source) {
        this.source = source;
    }
    tokenize() {
        const tokens = [];
        let token = this.nextToken();
        while (token.type !== TokenType.EOF) {
            tokens.push(token);
            token = this.nextToken();
        }
        tokens.push(token); // Push EOF
        return tokens;
    }
    nextToken() {
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
    createToken(type, value) {
        return { type, value, line: this.line, column: this.column - value.length };
    }
    advance() {
        const char = this.source[this.position++];
        this.column++;
        if (char === '\n') {
            this.line++;
            this.column = 1;
        }
        return char;
    }
    peek() {
        return this.position < this.source.length ? this.source[this.position] : '';
    }
    skipWhitespace() {
        while (/\s/.test(this.peek())) {
            this.advance();
        }
    }
    isAlpha(char) {
        return /[a-zA-Z_]/.test(char);
    }
    isAlphaNumeric(char) {
        return /[a-zA-Z0-9_]/.test(char);
    }
    isDigit(char) {
        return /[0-9]/.test(char);
    }
    getKeywordType(identifier) {
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
exports.Lexer = Lexer;
