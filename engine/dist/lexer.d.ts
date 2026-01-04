export declare enum TokenType {
    Let = "Let",
    Make = "Make",
    When = "When",
    Do = "Do",
    Else = "Else",
    Say = "Say",
    Return = "Return",
    Import = "Import",
    Export = "Export",
    Type = "Type",
    True = "True",
    False = "False",
    Null = "Null",
    Identifier = "Identifier",
    String = "String",
    Number = "Number",
    Equals = "Equals",// =
    Plus = "Plus",// +
    Minus = "Minus",// -
    Multiply = "Multiply",// *
    Divide = "Divide",// /
    Arrow = "Arrow",// =>
    GreaterThan = "GreaterThan",// >
    LessThan = "LessThan",// <
    Dot = "Dot",// .
    Comma = "Comma",// ,
    Colon = "Colon",// :
    LParen = "LParen",// (
    RParen = "RParen",// )
    LBrace = "LBrace",// {
    RBrace = "RBrace",// }
    LBracket = "LBracket",// [
    RBracket = "RBracket",// ]
    EOF = "EOF",
    Unknown = "Unknown"
}
export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}
export declare class Lexer {
    private source;
    private position;
    private line;
    private column;
    constructor(source: string);
    tokenize(): Token[];
    private nextToken;
    private createToken;
    private advance;
    private peek;
    private skipWhitespace;
    private isAlpha;
    private isAlphaNumeric;
    private isDigit;
    private getKeywordType;
}
