"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    // Keywords
    TokenType["LET"] = "LET";
    TokenType["CONST"] = "CONST";
    TokenType["FUNC"] = "FUNC";
    TokenType["MAKE"] = "MAKE";
    TokenType["SAY"] = "SAY";
    TokenType["IF"] = "IF";
    TokenType["ELSE"] = "ELSE";
    TokenType["WHILE"] = "WHILE";
    TokenType["LOOP"] = "LOOP";
    TokenType["FOR"] = "FOR";
    TokenType["IN"] = "IN";
    TokenType["MATCH"] = "MATCH";
    TokenType["RETURN"] = "RETURN";
    TokenType["STRUCT"] = "STRUCT";
    TokenType["ENUM"] = "ENUM";
    TokenType["IMPORT"] = "IMPORT";
    TokenType["FROM"] = "FROM";
    TokenType["ASYNC"] = "ASYNC";
    TokenType["AWAIT"] = "AWAIT";
    TokenType["SPAWN"] = "SPAWN";
    TokenType["BREAK"] = "BREAK";
    // Type Keywords (Basic)
    TokenType["TYPE_INT"] = "TYPE_INT";
    TokenType["TYPE_FLOAT"] = "TYPE_FLOAT";
    TokenType["TYPE_BOOL"] = "TYPE_BOOL";
    TokenType["TYPE_STRING"] = "TYPE_STRING";
    TokenType["TYPE_VOID"] = "TYPE_VOID";
    // Literals
    TokenType["IDENTIFIER"] = "IDENTIFIER";
    TokenType["NUMBER"] = "NUMBER";
    TokenType["STRING"] = "STRING";
    // Syntax
    TokenType["ASSIGN"] = "ASSIGN";
    TokenType["ARROW"] = "ARROW";
    TokenType["COLON"] = "COLON";
    TokenType["DOT"] = "DOT";
    TokenType["DOUBLE_COLON"] = "DOUBLE_COLON";
    TokenType["DOT_DOT"] = "DOT_DOT";
    TokenType["ELLIPSIS"] = "ELLIPSIS";
    TokenType["PIPE"] = "PIPE";
    TokenType["PIPE_OP"] = "PIPE_OP";
    TokenType["LPAREN"] = "LPAREN";
    TokenType["RPAREN"] = "RPAREN";
    TokenType["LBRACE"] = "LBRACE";
    TokenType["RBRACE"] = "RBRACE";
    TokenType["LBRACKET"] = "LBRACKET";
    TokenType["RBRACKET"] = "RBRACKET";
    TokenType["COMMA"] = "COMMA";
    TokenType["SEMICOLON"] = "SEMICOLON";
    // Operators
    TokenType["PLUS"] = "PLUS";
    TokenType["MINUS"] = "MINUS";
    TokenType["MULTIPLY"] = "MULTIPLY";
    TokenType["DIVIDE"] = "DIVIDE";
    TokenType["GT"] = "GT";
    TokenType["LT"] = "LT";
    TokenType["BY"] = "BY";
    TokenType["EOF"] = "EOF";
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
        while (this.position < this.source.length) {
            const char = this.current();
            if (this.isWhitespace(char)) {
                this.advance();
                continue;
            }
            if (this.isAlpha(char)) {
                tokens.push(this.readIdentifier());
                continue;
            }
            if (this.isDigit(char)) {
                tokens.push(this.readNumber());
                continue;
            }
            if (char === '"') {
                tokens.push(this.readString());
                continue;
            }
            // Multi-char operators
            if (char === '=' && this.peek() === '>') {
                tokens.push(this.createToken(TokenType.ARROW, '=>'));
                this.advance(2);
                continue;
            }
            if (char === ':' && this.peek() === ':') {
                tokens.push(this.createToken(TokenType.DOUBLE_COLON, '::'));
                this.advance(2);
                continue;
            }
            if (char === '-' && this.peek() === '>') {
                // Arrow for return type func() -> Type
                tokens.push(this.createToken(TokenType.ARROW, '->')); // Reuse ARROW or create RARROW? Using ARROW contextually or define new token if needed. 
                // Let's stick to ARROW for now or just treat -> as a separate token if parser needs distinction.
                // Actually v0.1 spec says -> OR : is used. Let's strictly separate if needed, but '=>' is body, '->' is return type.
                // Let's safe-guard and call it ARROW for now, parser can disambiguate or we rename to THIN_ARROW.
                // For simplicity, let's allow '->' to be a token.
                tokens.push(this.createToken(TokenType.ARROW, '->'));
                this.advance(2);
                continue;
            }
            if (char === '/' && this.peek() === '/') {
                this.skipComment();
                continue;
            }
            if (char === '#') {
                this.skipComment(); // Support # comments
                continue;
            }
            // Single-char tokens
            switch (char) {
                case '(':
                    tokens.push(this.createToken(TokenType.LPAREN, '('));
                    break;
                case ')':
                    tokens.push(this.createToken(TokenType.RPAREN, ')'));
                    break;
                case '=':
                    if (this.peek() === '>') {
                        this.advance();
                        tokens.push(this.createToken(TokenType.ARROW, '=>'));
                    }
                    else {
                        tokens.push(this.createToken(TokenType.ASSIGN, '='));
                    }
                    break;
                case '|':
                    if (this.peek() === '>') {
                        this.advance();
                        tokens.push(this.createToken(TokenType.PIPE_OP, '|>'));
                    }
                    else {
                        tokens.push(this.createToken(TokenType.PIPE, '|'));
                    }
                    break;
                case '.':
                    if (this.peek() === '.') {
                        this.advance();
                        if (this.peek() === '.') {
                            this.advance();
                            tokens.push(this.createToken(TokenType.ELLIPSIS, '...'));
                        }
                        else {
                            tokens.push(this.createToken(TokenType.DOT_DOT, '..'));
                        }
                    }
                    else {
                        tokens.push(this.createToken(TokenType.DOT, '.'));
                    }
                    break;
                case ':':
                    if (this.peek() === ':') {
                        this.advance();
                        tokens.push(this.createToken(TokenType.DOUBLE_COLON, '::'));
                    }
                    else {
                        tokens.push(this.createToken(TokenType.COLON, ':'));
                    }
                    break;
                case '{':
                    tokens.push(this.createToken(TokenType.LBRACE, '{'));
                    break;
                case '}':
                    tokens.push(this.createToken(TokenType.RBRACE, '}'));
                    break;
                case '[':
                    tokens.push(this.createToken(TokenType.LBRACKET, '['));
                    break;
                case ']':
                    tokens.push(this.createToken(TokenType.RBRACKET, ']'));
                    break;
                case ',':
                    tokens.push(this.createToken(TokenType.COMMA, ','));
                    break;
                case ';':
                    tokens.push(this.createToken(TokenType.SEMICOLON, ';'));
                    break;
                case '+':
                    tokens.push(this.createToken(TokenType.PLUS, '+'));
                    break;
                case '-':
                    tokens.push(this.createToken(TokenType.MINUS, '-'));
                    break;
                case '*':
                    tokens.push(this.createToken(TokenType.MULTIPLY, '*'));
                    break;
                case '/':
                    tokens.push(this.createToken(TokenType.DIVIDE, '/'));
                    break;
                case '>':
                    tokens.push(this.createToken(TokenType.GT, '>'));
                    break;
                case '<':
                    tokens.push(this.createToken(TokenType.LT, '<'));
                    break;
                default:
                    console.warn(`Unexpected character: ${char} at ${this.line}:${this.column}`);
            }
            this.advance();
        }
        tokens.push(this.createToken(TokenType.EOF, ''));
        return tokens;
    }
    current() {
        return this.source[this.position];
    }
    peek() {
        if (this.position + 1 >= this.source.length)
            return '';
        return this.source[this.position + 1];
    }
    advance(n = 1) {
        for (let i = 0; i < n; i++) {
            if (this.position >= this.source.length)
                break;
            if (this.current() === '\n') {
                this.line++;
                this.column = 1;
            }
            else {
                this.column++;
            }
            this.position++;
        }
    }
    createToken(type, value) {
        return { type, value, line: this.line, column: this.column };
    }
    isWhitespace(char) {
        return /\s/.test(char);
    }
    isAlpha(char) {
        return /[a-zA-Z_]/.test(char);
    }
    isDigit(char) {
        return /[0-9]/.test(char);
    }
    readIdentifier() {
        const startLine = this.line;
        const startCol = this.column;
        let value = '';
        while (this.position < this.source.length && (this.isAlpha(this.current()) || this.isDigit(this.current()))) {
            value += this.current();
            this.advance();
        }
        const type = this.getKeywordType(value) || TokenType.IDENTIFIER;
        return { type, value, line: startLine, column: startCol };
    }
    getKeywordType(value) {
        switch (value) {
            case 'let':
            case 'l': return TokenType.LET;
            case 'const': return TokenType.CONST;
            case 'fn':
            case 'func': // v0.1
            case 'f': // v0.1 short
                return TokenType.FUNC;
            case 'make': return TokenType.MAKE;
            case 'say': return TokenType.SAY;
            case 'p': return TokenType.SAY; // short for print/say
            case 'print': return TokenType.SAY; // alias
            case 'if': return TokenType.IF;
            case 'else':
            case 'e': return TokenType.ELSE;
            case 'while': return TokenType.WHILE;
            case 'loop': return TokenType.LOOP;
            case 'for': return TokenType.FOR;
            case 'in': return TokenType.IN;
            case 'break': return TokenType.BREAK;
            case 'by': return TokenType.BY;
            case 'match':
            case 'm': return TokenType.MATCH;
            case 'return':
            case 'ret': return TokenType.RETURN;
            case 'struct': return TokenType.STRUCT;
            case 'enum': return TokenType.ENUM;
            case 'import': return TokenType.IMPORT;
            case 'from': return TokenType.FROM;
            case 'async': return TokenType.ASYNC;
            case 'await': return TokenType.AWAIT;
            case 'spawn': return TokenType.SPAWN;
            // Types
            case 'Int': return TokenType.TYPE_INT;
            case 'Float': return TokenType.TYPE_FLOAT;
            case 'Bool': return TokenType.TYPE_BOOL;
            case 'String': return TokenType.TYPE_STRING;
            case 'Void': return TokenType.TYPE_VOID;
            default: return undefined;
        }
    }
    readNumber() {
        const startLine = this.line;
        const startCol = this.column;
        let value = '';
        while (this.position < this.source.length && this.isDigit(this.current())) {
            value += this.current();
            this.advance();
        }
        // Handle float
        if (this.current() === '.' && this.isDigit(this.peek())) {
            value += '.';
            this.advance();
            while (this.position < this.source.length && this.isDigit(this.current())) {
                value += this.current();
                this.advance();
            }
        }
        return { type: TokenType.NUMBER, value, line: startLine, column: startCol };
    }
    readString() {
        const startLine = this.line;
        const startCol = this.column;
        this.advance(); // Skip opening quote
        let value = '';
        while (this.position < this.source.length && this.current() !== '"') {
            value += this.current();
            this.advance();
        }
        this.advance(); // Skip closing quote
        return { type: TokenType.STRING, value, line: startLine, column: startCol };
    }
    skipComment() {
        while (this.position < this.source.length && this.current() !== '\n') {
            this.advance();
        }
    }
}
exports.Lexer = Lexer;
