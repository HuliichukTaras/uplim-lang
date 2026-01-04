"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UPLimParser = void 0;
const lexer_1 = require("./lexer");
class UPLimParser {
    tokens = [];
    current = 0;
    errors = [];
    parse(source, filename) {
        const lexer = new lexer_1.Lexer(source);
        this.tokens = lexer.tokenize();
        this.current = 0;
        this.errors = [];
        const program = {
            type: 'Program',
            body: [],
            location: { line: 1, column: 1 }
        };
        while (!this.isAtEnd()) {
            try {
                const stmt = this.declaration();
                if (stmt) {
                    program.body.push(stmt);
                }
            }
            catch (error) {
                this.synchronize();
            }
        }
        return { ast: program, errors: this.errors };
    }
    declaration() {
        if (this.match(lexer_1.TokenType.Let))
            return this.variableDeclaration();
        if (this.match(lexer_1.TokenType.Make))
            return this.functionDeclaration();
        return this.statement();
    }
    variableDeclaration() {
        const name = this.consume(lexer_1.TokenType.Identifier, "Expect variable name.");
        this.consume(lexer_1.TokenType.Equals, "Expect '=' after variable name.");
        const value = this.expression();
        // No newline check yet, assuming implied or explicit
        return {
            type: 'VariableDeclaration',
            name: name.value,
            value,
            location: { line: name.line, column: name.column }
        };
    }
    functionDeclaration() {
        const name = this.consume(lexer_1.TokenType.Identifier, "Expect function name.");
        this.consume(lexer_1.TokenType.LParen, "Expect '(' after function name.");
        const params = [];
        if (!this.check(lexer_1.TokenType.RParen)) {
            do {
                params.push(this.consume(lexer_1.TokenType.Identifier, "Expect parameter name.").value);
            } while (this.match(lexer_1.TokenType.Comma));
        }
        this.consume(lexer_1.TokenType.RParen, "Expect ')' after parameters.");
        this.consume(lexer_1.TokenType.Arrow, "Expect '=>' or 'do' before function body."); // Simplified for one-liner
        // For block body check 'do' if implemented, for now supporting expression body
        const body = [];
        const stmt = {
            type: 'ExpressionStatement',
            expression: this.expression(),
            location: { line: name.line, column: name.column }
        };
        body.push(stmt);
        return {
            type: 'FunctionDeclaration',
            name: name.value,
            params,
            body,
            location: { line: name.line, column: name.column }
        };
    }
    statement() {
        if (this.match(lexer_1.TokenType.When))
            return this.ifStatement();
        if (this.match(lexer_1.TokenType.Say))
            return this.printStatement();
        return this.expressionStatement();
    }
    printStatement() {
        const token = this.previous();
        const value = this.expression();
        return {
            type: 'PrintStatement',
            expression: value,
            location: { line: token.line, column: token.column }
        };
    }
    ifStatement() {
        const token = this.previous();
        const condition = this.expression();
        this.consume(lexer_1.TokenType.Do, "Expect 'do' after condition.");
        const thenBranch = [];
        while (!this.check(lexer_1.TokenType.Else) && !this.check(lexer_1.TokenType.EOF)) {
            const stmt = this.declaration();
            if (stmt)
                thenBranch.push(stmt);
        }
        let elseBranch = undefined;
        if (this.match(lexer_1.TokenType.Else)) {
            elseBranch = [];
            while (!this.check(lexer_1.TokenType.EOF)) { // Simplistic block end
                // If we hit 'when', 'make', etc inside else, good. 
                // But we need a delimiter. 
                // UPLim syntax 'when ... do ...' likely implies end? Or indented?
                // Since "Simple like Python", maybe indent based? 
                // For now, let's assume 'else' block goes until explicit End or EOF or next declaration at same level?
                // The example doesn't show 'end'. 
                // "when x > 5 do ... else ..."
                // Assuming single statement or block until next keyword?
                // Let's assume it consumes until EOF for this simple test case, OR we implement indentation detection Lexer later.
                // For now, let's consume ONE statement if no indentation logic.
                // OR effectively consume until EOF or next recognizable top-level keyword if we were deeper.
                const stmt = this.declaration();
                if (stmt)
                    elseBranch.push(stmt);
                if (this.isAtEnd())
                    break;
            }
        }
        return {
            type: 'IfStatement',
            condition,
            thenBranch,
            elseBranch,
            location: { line: token.line, column: token.column }
        };
    }
    expressionStatement() {
        const expr = this.expression();
        return {
            type: 'ExpressionStatement',
            expression: expr,
            location: expr.location
        };
    }
    expression() {
        return this.equality();
    }
    equality() {
        let expr = this.comparison();
        while (this.match(lexer_1.TokenType.Equals)) { // equality operator
            const operator = this.previous().value;
            const right = this.comparison();
            expr = {
                type: 'BinaryExpression',
                left: expr,
                operator,
                right,
                location: expr.location
            };
        }
        return expr;
    }
    comparison() {
        let expr = this.term();
        while (this.match(lexer_1.TokenType.GreaterThan, lexer_1.TokenType.LessThan)) {
            const operator = this.previous().value;
            const right = this.term();
            expr = {
                type: 'BinaryExpression',
                left: expr,
                operator,
                right,
                location: expr.location
            };
        }
        return expr;
    }
    term() {
        let expr = this.factor();
        while (this.match(lexer_1.TokenType.Plus, lexer_1.TokenType.Minus)) {
            const operator = this.previous().value;
            const right = this.factor();
            expr = {
                type: 'BinaryExpression',
                left: expr,
                operator,
                right,
                location: expr.location
            };
        }
        return expr;
    }
    factor() {
        let expr = this.unary();
        while (this.match(lexer_1.TokenType.Multiply, lexer_1.TokenType.Divide)) {
            const operator = this.previous().value;
            const right = this.unary();
            expr = {
                type: 'BinaryExpression',
                left: expr,
                operator,
                right,
                location: expr.location
            };
        }
        return expr;
    }
    unary() {
        return this.primary();
    }
    primary() {
        if (this.match(lexer_1.TokenType.False))
            return { type: 'Literal', value: false, raw: 'false', location: this.previousPos() };
        if (this.match(lexer_1.TokenType.True))
            return { type: 'Literal', value: true, raw: 'true', location: this.previousPos() };
        if (this.match(lexer_1.TokenType.Null))
            return { type: 'Literal', value: null, raw: 'null', location: this.previousPos() };
        if (this.match(lexer_1.TokenType.Number)) {
            return { type: 'Literal', value: parseFloat(this.previous().value), raw: this.previous().value, location: this.previousPos() };
        }
        if (this.match(lexer_1.TokenType.String)) {
            return { type: 'Literal', value: this.previous().value, raw: this.previous().value, location: this.previousPos() };
        }
        if (this.match(lexer_1.TokenType.Identifier)) {
            const name = this.previous();
            if (this.match(lexer_1.TokenType.LParen)) {
                return this.finishCall(name);
            }
            return { type: 'Identifier', name: name.value, location: { line: name.line, column: name.column } };
        }
        if (this.match(lexer_1.TokenType.LParen)) {
            const expr = this.expression();
            this.consume(lexer_1.TokenType.RParen, "Expect ')' after expression.");
            return expr;
        }
        throw this.error(this.peek(), "Expect expression.");
    }
    finishCall(callee) {
        const args = [];
        if (!this.check(lexer_1.TokenType.RParen)) {
            do {
                args.push(this.expression());
            } while (this.match(lexer_1.TokenType.Comma));
        }
        const paren = this.consume(lexer_1.TokenType.RParen, "Expect ')' after arguments.");
        return {
            type: 'CallExpression',
            callee: callee.value,
            args,
            location: { line: callee.line, column: callee.column }
        };
    }
    match(...types) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }
    check(type) {
        if (this.isAtEnd())
            return false;
        return this.peek().type === type;
    }
    advance() {
        if (!this.isAtEnd())
            this.current++;
        return this.previous();
    }
    isAtEnd() {
        return this.peek().type === lexer_1.TokenType.EOF;
    }
    peek() {
        return this.tokens[this.current];
    }
    previous() {
        return this.tokens[this.current - 1];
    }
    previousPos() {
        const p = this.previous();
        return { line: p.line, column: p.column };
    }
    consume(type, message) {
        if (this.check(type))
            return this.advance();
        throw this.error(this.peek(), message);
    }
    error(token, message) {
        this.errors.push({
            message,
            line: token.line,
            column: token.column,
            severity: 'error'
        });
        return new Error(message);
    }
    synchronize() {
        this.advance();
        while (!this.isAtEnd()) {
            // if (this.previous().type == TokenType.Semicolon) return;
            switch (this.peek().type) {
                case lexer_1.TokenType.Make:
                case lexer_1.TokenType.Let:
                case lexer_1.TokenType.When:
                case lexer_1.TokenType.Return:
                    return;
            }
            this.advance();
        }
    }
}
exports.UPLimParser = UPLimParser;
