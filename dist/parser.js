"use strict";
// UPLim Parser - converts source code to AST
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPLimParser = void 0;
const lexer_1 = require("./lexer");
class UPLimParser {
    tokens = [];
    position = 0;
    errors = []; // Make public for CLI access
    parse(source, filename = 'unknown') {
        const lexer = new lexer_1.Lexer(source);
        this.tokens = lexer.tokenize();
        this.position = 0;
        this.errors = []; // Reset errors
        this.errors = [];
        const program = {
            type: 'Program',
            body: [],
            location: { line: 1, column: 1 }
        };
        while (this.current().type !== lexer_1.TokenType.EOF) {
            try {
                const stmt = this.parseStatement();
                if (stmt) {
                    program.body.push(stmt);
                }
            }
            catch (e) {
                this.errors.push({
                    message: e.message,
                    line: this.current().line,
                    column: this.current().column,
                    severity: 'error'
                });
                this.synchronize();
            }
        }
        return { ast: program, errors: this.errors };
    }
    parseStatement() {
        const token = this.current();
        if (token.type === lexer_1.TokenType.LET) {
            return this.parseVariableDeclaration();
        }
        if (token.type === lexer_1.TokenType.FUNC || token.type === lexer_1.TokenType.MAKE) {
            return this.parseFunctionDeclaration();
        }
        if (token.type === lexer_1.TokenType.SAY) {
            return this.parseSayStatement();
        }
        if (token.type === lexer_1.TokenType.IF) {
            return this.parseIfStatement();
        }
        if (token.type === lexer_1.TokenType.LBRACE) {
            return this.parseBlock();
        }
        if (token.type === lexer_1.TokenType.RETURN) {
            return this.parseReturnStatement();
        }
        return this.parseExpressionStatement();
    }
    parseVariableDeclaration() {
        const startToken = this.consume(lexer_1.TokenType.LET);
        let pattern;
        if (this.match(lexer_1.TokenType.LBRACE)) {
            // Object Destructuring { a, b }
            const properties = [];
            if (this.current().type !== lexer_1.TokenType.RBRACE) {
                do {
                    const key = this.consume(lexer_1.TokenType.IDENTIFIER, "Expected property name").value;
                    // For now simple { a, b } support (shorthand)
                    // If we want { a: b }, we need check for COLON
                    let value = key;
                    if (this.match(lexer_1.TokenType.COLON)) {
                        value = this.consume(lexer_1.TokenType.IDENTIFIER, "Expected variable name").value;
                    }
                    properties.push({ key, value });
                } while (this.match(lexer_1.TokenType.COMMA));
            }
            this.consume(lexer_1.TokenType.RBRACE, "Expected '}'");
            pattern = { type: 'ObjectPattern', properties, location: startToken };
        }
        else if (this.match(lexer_1.TokenType.LBRACKET)) {
            // Array Destructuring [ a, b ]
            const elements = [];
            if (this.current().type !== lexer_1.TokenType.RBRACKET) {
                do {
                    elements.push(this.consume(lexer_1.TokenType.IDENTIFIER, "Expected variable name").value);
                } while (this.match(lexer_1.TokenType.COMMA));
            }
            this.consume(lexer_1.TokenType.RBRACKET, "Expected ']'");
            pattern = { type: 'ArrayPattern', elements, location: startToken };
        }
        else {
            const name = this.consume(lexer_1.TokenType.IDENTIFIER, "Expected variable name").value;
            pattern = { type: 'Identifier', name, location: startToken };
        }
        this.consume(lexer_1.TokenType.ASSIGN, "Expected '=' after variable declaration");
        const value = this.parseExpression();
        // Optional semicolon
        if (this.current().type === lexer_1.TokenType.SEMICOLON) {
            this.advance();
        }
        return {
            type: 'VariableDeclaration',
            pattern,
            value,
            location: { line: startToken.line, column: startToken.column }
        };
    }
    parseReturnStatement() {
        const token = this.consume(lexer_1.TokenType.RETURN);
        let argument;
        if (this.current().type !== lexer_1.TokenType.SEMICOLON && this.current().type !== lexer_1.TokenType.RBRACE) {
            argument = this.parseExpression();
        }
        if (this.match(lexer_1.TokenType.SEMICOLON)) {
            // consumed
        }
        return { type: 'ReturnStatement', argument, location: token };
    }
    parseFunctionDeclaration() {
        const startToken = this.advance(); // func or make
        const name = this.consume(lexer_1.TokenType.IDENTIFIER, "Expected function name").value;
        this.consume(lexer_1.TokenType.LPAREN, "Expected '(' after function name");
        const params = [];
        if (this.current().type !== lexer_1.TokenType.RPAREN) {
            do {
                params.push(this.consume(lexer_1.TokenType.IDENTIFIER, "Expected parameter name").value);
            } while (this.match(lexer_1.TokenType.COMMA));
        }
        this.consume(lexer_1.TokenType.RPAREN, "Expected ')' after parameters");
        let body;
        if (this.match(lexer_1.TokenType.ARROW)) {
            const expr = this.parseExpression();
            // Implicit return block for short syntax
            body = {
                type: 'BlockStatement',
                location: { line: startToken.line, column: startToken.column },
                body: [{
                        type: 'ExpressionStatement', // In a real lang this might be explicit return, simplifying for now
                        expression: expr,
                        location: expr.location
                    }]
            };
        }
        else {
            body = this.parseBlock();
        }
        return {
            type: 'FunctionDeclaration',
            name,
            params,
            body,
            location: { line: startToken.line, column: startToken.column }
        };
    }
    parseSayStatement() {
        const startToken = this.consume(lexer_1.TokenType.SAY);
        const argument = this.parseExpression();
        if (this.current().type === lexer_1.TokenType.SEMICOLON) {
            this.advance();
        }
        return {
            type: 'SayStatement',
            argument,
            location: { line: startToken.line, column: startToken.column }
        };
    }
    parseIfStatement() {
        const startToken = this.consume(lexer_1.TokenType.IF);
        const test = this.parseExpression();
        const consequent = this.parseBlock();
        let alternate;
        if (this.match(lexer_1.TokenType.ELSE)) {
            if (this.current().type === lexer_1.TokenType.IF) {
                // else if - wrap in block
                alternate = {
                    type: 'BlockStatement',
                    location: this.current(),
                    body: [this.parseIfStatement()]
                };
            }
            else {
                alternate = this.parseBlock();
            }
        }
        return {
            type: 'IfStatement',
            test,
            consequent,
            alternate,
            location: { line: startToken.line, column: startToken.column }
        };
    }
    parseBlock() {
        const startToken = this.consume(lexer_1.TokenType.LBRACE, "Expected '{'");
        const body = [];
        while (this.current().type !== lexer_1.TokenType.RBRACE && this.current().type !== lexer_1.TokenType.EOF) {
            const stmt = this.parseStatement();
            if (stmt)
                body.push(stmt);
        }
        this.consume(lexer_1.TokenType.RBRACE, "Expected '}'");
        return {
            type: 'BlockStatement',
            body,
            location: { line: startToken.line, column: startToken.column }
        };
    }
    parseExpressionStatement() {
        const expr = this.parseExpression();
        if (this.current().type === lexer_1.TokenType.SEMICOLON) {
            this.advance();
        }
        return {
            type: 'ExpressionStatement',
            expression: expr,
            location: expr.location
        };
    }
    parseExpression() {
        return this.parseBinaryExpression(0);
    }
    getPrecedence(type) {
        switch (type) {
            case lexer_1.TokenType.PIPE_OP:
                return 1;
            case lexer_1.TokenType.LT:
            case lexer_1.TokenType.GT:
                return 2;
            case lexer_1.TokenType.PLUS:
            case lexer_1.TokenType.MINUS:
                return 3;
            case lexer_1.TokenType.MULTIPLY:
            case lexer_1.TokenType.DIVIDE:
                return 4;
            case lexer_1.TokenType.DOT_DOT:
                return 5;
            default:
                return -1;
        }
    }
    parseBinaryExpression(minPrecedence) {
        let left = this.parsePrimary();
        while (true) {
            const token = this.current();
            const precedence = this.getPrecedence(token.type);
            if (precedence < minPrecedence)
                break;
            this.advance();
            // Handle Range special case for 'by'
            if (token.type === lexer_1.TokenType.DOT_DOT) {
                const end = this.parseBinaryExpression(precedence + 1);
                let step;
                if (this.match(lexer_1.TokenType.BY)) {
                    step = this.parseExpression();
                }
                left = {
                    type: 'RangeExpression',
                    start: left,
                    end,
                    step,
                    location: left.location
                };
                continue;
            }
            // Handle Pipeline
            if (token.type === lexer_1.TokenType.PIPE_OP) {
                const right = this.parseBinaryExpression(precedence + 1);
                left = {
                    type: 'PipelineExpression',
                    left,
                    right,
                    location: left.location
                };
                continue;
            }
            const right = this.parseBinaryExpression(precedence + 1);
            left = {
                type: 'BinaryExpression',
                operator: token.value,
                left,
                right,
                location: left.location
            };
        }
        return left;
    }
    parsePrimary() {
        const token = this.current();
        if (token.type === lexer_1.TokenType.NUMBER) {
            this.advance();
            return { type: 'Literal', value: Number(token.value), raw: token.value, location: token };
        }
        if (token.type === lexer_1.TokenType.STRING) {
            this.advance();
            return { type: 'Literal', value: token.value, raw: token.value, location: token };
        }
        if (token.type === lexer_1.TokenType.IDENTIFIER) {
            this.advance();
            // Check for call
            if (this.current().type === lexer_1.TokenType.LPAREN) {
                return this.finishCall({ type: 'Identifier', name: token.value, location: token });
            }
            return { type: 'Identifier', name: token.value, location: token };
        }
        if (token.type === lexer_1.TokenType.LBRACKET) {
            return this.parseArrayOrComprehension();
        }
        if (token.type === lexer_1.TokenType.LBRACE) {
            // Object literal syntax not fully defined in v0.1 spec but good to have
            // For now, assume Block if in statement context, but here we are in Expression context.
            // However, parser calls parseBlock for LBRACE in parseStatement.
            // We need to verify if we support Object Literals in parser.
            // Simple implementation for now.
            return this.parseObjectLiteral();
        }
        if (token.type === lexer_1.TokenType.LPAREN) {
            this.advance();
            const expr = this.parseExpression();
            this.consume(lexer_1.TokenType.RPAREN, "Expected ')'");
            return expr;
        }
        if (token.type === lexer_1.TokenType.FUNC) {
            return this.parseFunctionExpression();
        }
        throw new Error(`Unexpected token: ${token.type} (${token.value})`);
    }
    parseArrayOrComprehension() {
        const start = this.consume(lexer_1.TokenType.LBRACKET);
        // Check for empty array
        if (this.match(lexer_1.TokenType.RBRACKET)) {
            return { type: 'ArrayLiteral', elements: [], location: start };
        }
        const firstExpr = this.parseExpression();
        // Check for Comprehension: [ x * x | x in list ... ]
        // We look for PIPE token
        if (this.match(lexer_1.TokenType.PIPE)) {
            // It is a comprehension
            // Syntax: [ expression | identifier in source (, condition)? ]
            // Current we have parsed 'expression'
            const id = this.consume(lexer_1.TokenType.IDENTIFIER, "Expected identifier after '|' in comprehension").value;
            this.consume(lexer_1.TokenType.IN, "Expected 'in' keyword");
            const source = this.parseExpression();
            let filter;
            if (this.match(lexer_1.TokenType.COMMA)) {
                filter = this.parseExpression();
            }
            this.consume(lexer_1.TokenType.RBRACKET, "Expected ']'");
            return {
                type: 'ListComprehension',
                expression: firstExpr,
                element: id,
                source: source,
                filter,
                location: start
            };
        }
        // Array Literal
        const elements = [firstExpr];
        while (this.match(lexer_1.TokenType.COMMA)) {
            if (this.current().type === lexer_1.TokenType.RBRACKET)
                break; // trailing comma
            elements.push(this.parseExpression());
        }
        this.consume(lexer_1.TokenType.RBRACKET, "Expected ']'");
        return { type: 'ArrayLiteral', elements, location: start };
    }
    parseObjectLiteral() {
        const start = this.consume(lexer_1.TokenType.LBRACE);
        const properties = [];
        if (this.current().type !== lexer_1.TokenType.RBRACE) {
            do {
                const key = this.consume(lexer_1.TokenType.IDENTIFIER, "Expected property name").value;
                this.consume(lexer_1.TokenType.COLON, "Expected ':'");
                const value = this.parseExpression();
                properties.push({ key, value });
            } while (this.match(lexer_1.TokenType.COMMA));
        }
        this.consume(lexer_1.TokenType.RBRACE, "Expected '}'");
        return { type: 'ObjectLiteral', properties, location: start };
    }
    parseFunctionExpression() {
        const startToken = this.consume(lexer_1.TokenType.FUNC);
        let name;
        if (this.current().type === lexer_1.TokenType.IDENTIFIER) {
            name = this.consume(lexer_1.TokenType.IDENTIFIER).value;
        }
        this.consume(lexer_1.TokenType.LPAREN, "Expected '('");
        const params = [];
        if (this.current().type !== lexer_1.TokenType.RPAREN) {
            do {
                params.push(this.consume(lexer_1.TokenType.IDENTIFIER, "Expected parameter name").value);
            } while (this.match(lexer_1.TokenType.COMMA));
        }
        this.consume(lexer_1.TokenType.RPAREN, "Expected ')'");
        let body;
        if (this.match(lexer_1.TokenType.ARROW)) {
            const expr = this.parseExpression();
            body = {
                type: 'BlockStatement',
                location: expr.location,
                body: [{
                        type: 'ExpressionStatement',
                        expression: expr,
                        location: expr.location
                    }]
            };
        }
        else {
            body = this.parseBlock();
        }
        return {
            type: 'FunctionExpression',
            name,
            params,
            body,
            location: startToken
        };
    }
    finishCall(callee) {
        this.consume(lexer_1.TokenType.LPAREN);
        const args = [];
        if (this.current().type !== lexer_1.TokenType.RPAREN) {
            do {
                args.push(this.parseExpression());
            } while (this.match(lexer_1.TokenType.COMMA));
        }
        this.consume(lexer_1.TokenType.RPAREN);
        return {
            type: 'CallExpression',
            callee,
            arguments: args,
            location: callee.location
        };
    }
    current() {
        return this.tokens[this.position];
    }
    advance() {
        if (this.position < this.tokens.length - 1) {
            this.position++;
        }
        return this.tokens[this.position - 1];
    }
    consume(type, message) {
        if (this.current().type === type) {
            this.position++;
            return this.tokens[this.position - 1];
        }
        throw new Error(message || `Expected ${type} but got ${this.current().type}`);
    }
    match(type) {
        if (this.current().type === type) {
            this.advance();
            return true;
        }
        return false;
    }
    synchronize() {
        this.advance();
        while (this.current().type !== lexer_1.TokenType.EOF) {
            if (this.current().type === lexer_1.TokenType.SEMICOLON)
                return;
            switch (this.current().type) {
                case lexer_1.TokenType.LET:
                case lexer_1.TokenType.FUNC:
                case lexer_1.TokenType.IF:
                case lexer_1.TokenType.WHILE:
                case lexer_1.TokenType.RETURN:
                    return;
            }
            this.advance();
        }
    }
}
exports.UPLimParser = UPLimParser;
