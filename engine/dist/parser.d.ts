export interface ASTNode {
    type: string;
    location: {
        line: number;
        column: number;
    };
}
export interface Program extends ASTNode {
    type: 'Program';
    body: ASTNode[];
}
export interface PrintStatement extends ASTNode {
    type: 'PrintStatement';
    expression: Expression;
}
export interface VariableDeclaration extends ASTNode {
    type: 'VariableDeclaration';
    name: string;
    value: Expression;
}
export interface FunctionDeclaration extends ASTNode {
    type: 'FunctionDeclaration';
    name: string;
    params: string[];
    body: ASTNode[];
}
export interface IfStatement extends ASTNode {
    type: 'IfStatement';
    condition: Expression;
    thenBranch: ASTNode[];
    elseBranch?: ASTNode[];
}
export interface ExpressionStatement extends ASTNode {
    type: 'ExpressionStatement';
    expression: Expression;
}
export interface CallExpression extends ASTNode {
    type: 'CallExpression';
    callee: string;
    args: Expression[];
}
export interface BinaryExpression extends ASTNode {
    type: 'BinaryExpression';
    left: Expression;
    operator: string;
    right: Expression;
}
export interface Literal extends ASTNode {
    type: 'Literal';
    value: any;
    raw: string;
}
export interface Identifier extends ASTNode {
    type: 'Identifier';
    name: string;
}
export type Expression = Literal | Identifier | BinaryExpression | CallExpression;
export interface ParseResult {
    ast: Program;
    errors: ParseError[];
}
export interface ParseError {
    message: string;
    line: number;
    column: number;
    severity: 'error' | 'warning';
}
export declare class UPLimParser {
    private tokens;
    private current;
    private errors;
    parse(source: string, filename: string): ParseResult;
    private declaration;
    private variableDeclaration;
    private functionDeclaration;
    private statement;
    private printStatement;
    private ifStatement;
    private expressionStatement;
    private expression;
    private equality;
    private comparison;
    private term;
    private factor;
    private unary;
    private primary;
    private finishCall;
    private match;
    private check;
    private advance;
    private isAtEnd;
    private peek;
    private previous;
    private previousPos;
    private consume;
    private error;
    private synchronize;
}
