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
export type Pattern = Identifier | ObjectPattern | ArrayPattern;
export interface ObjectPattern extends ASTNode {
    type: 'ObjectPattern';
    properties: {
        key: string;
        value: string;
    }[];
}
export interface ArrayPattern extends ASTNode {
    type: 'ArrayPattern';
    elements: string[];
}
export interface VariableDeclaration extends ASTNode {
    type: 'VariableDeclaration';
    pattern: Pattern;
    value: Expression;
}
export interface FunctionDeclaration extends ASTNode {
    type: 'FunctionDeclaration';
    name: string;
    params: string[];
    body: BlockStatement;
}
export interface FunctionExpression extends ASTNode {
    type: 'FunctionExpression';
    name?: string;
    params: string[];
    body: BlockStatement;
}
export interface BlockStatement extends ASTNode {
    type: 'BlockStatement';
    body: ASTNode[];
}
export interface SayStatement extends ASTNode {
    type: 'SayStatement';
    argument: Expression;
}
export interface IfStatement extends ASTNode {
    type: 'IfStatement';
    test: Expression;
    consequent: BlockStatement;
    alternate?: BlockStatement;
}
export interface ReturnStatement extends ASTNode {
    type: 'ReturnStatement';
    argument?: Expression;
}
export interface ExpressionStatement extends ASTNode {
    type: 'ExpressionStatement';
    expression: Expression;
}
export type Expression = BinaryExpression | Literal | Identifier | CallExpression | PipelineExpression | RangeExpression | ListComprehension | RangeExpression | ListComprehension | ArrayLiteral | ObjectLiteral | FunctionExpression;
export interface PipelineExpression extends ASTNode {
    type: 'PipelineExpression';
    left: Expression;
    right: Expression;
}
export interface RangeExpression extends ASTNode {
    type: 'RangeExpression';
    start: Expression;
    end: Expression;
    step?: Expression;
}
export interface ListComprehension extends ASTNode {
    type: 'ListComprehension';
    expression: Expression;
    element: string;
    source: Expression;
    filter?: Expression;
}
export interface ArrayLiteral extends ASTNode {
    type: 'ArrayLiteral';
    elements: Expression[];
}
export interface ObjectLiteral extends ASTNode {
    type: 'ObjectLiteral';
    properties: {
        key: string;
        value: Expression;
    }[];
}
export interface BinaryExpression extends ASTNode {
    type: 'BinaryExpression';
    operator: string;
    left: Expression;
    right: Expression;
}
export interface CallExpression extends ASTNode {
    type: 'CallExpression';
    callee: Identifier;
    arguments: Expression[];
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
    private position;
    errors: ParseError[];
    parse(source: string, filename?: string): ParseResult;
    private parseStatement;
    private parseVariableDeclaration;
    private parseReturnStatement;
    private parseFunctionDeclaration;
    private parseSayStatement;
    private parseIfStatement;
    private parseBlock;
    private parseExpressionStatement;
    private parseExpression;
    private getPrecedence;
    private parseBinaryExpression;
    private parsePrimary;
    private parseArrayOrComprehension;
    private parseObjectLiteral;
    private parseFunctionExpression;
    private finishCall;
    private current;
    private advance;
    private consume;
    private match;
    private synchronize;
}
