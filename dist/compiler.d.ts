import { Program } from './parser';
export declare class Compiler {
    compile(program: Program): string;
    private compileBlock;
    private compileNode;
    private compileVariableDeclaration;
    private compileFunctionDeclaration;
    private compileSayStatement;
    private compileIfStatement;
    private compileBlockStatement;
    private compileExpressionStatement;
    private compileBinaryExpression;
    private compileCallExpression;
    private compileLiteral;
    private compileIdentifier;
    private compileReturnStatement;
    private compileFunctionExpression;
    private compilePipelineExpression;
    private compileRangeExpression;
    private compileListComprehension;
    private compileArrayLiteral;
    private compileObjectLiteral;
}
