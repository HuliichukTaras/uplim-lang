import { Program } from './parser';
export declare class Interpreter {
    private environment;
    private output;
    interpret(ast: Program): string;
    private execute;
    private visitVariableDeclaration;
    private visitPrintStatement;
    private visitIfStatement;
    private evaluate;
    private lookupVariable;
    private visitBinary;
    private isTruthy;
}
