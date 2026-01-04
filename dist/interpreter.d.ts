import { Program } from './parser';
export declare class Environment {
    private values;
    parent?: Environment;
    constructor(parent?: Environment);
    define(name: string, value: any): void;
    get(name: string): any;
    assign(name: string, value: any): void;
}
export declare class Interpreter {
    private globalEnv;
    private output;
    constructor();
    evaluate(program: Program): string[];
    private executeBlock;
    private execute;
    private visitVariableDeclaration;
    private visitFunctionDeclaration;
    private visitSayStatement;
    private visitIfStatement;
    private visitBlockStatement;
    private visitExpression;
    private evaluateExpression;
    private visitBinaryExpression;
    private visitCallExpression;
    private isTruthy;
}
