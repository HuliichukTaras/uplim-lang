export declare enum TokenType {
    LET = "LET",
    CONST = "CONST",
    FUNC = "FUNC",// func or f
    MAKE = "MAKE",// keep for backward compat until full migration
    SAY = "SAY",// keep for backward compat or alias to print
    IF = "IF",
    ELSE = "ELSE",
    WHILE = "WHILE",
    LOOP = "LOOP",
    FOR = "FOR",
    IN = "IN",
    MATCH = "MATCH",
    RETURN = "RETURN",
    STRUCT = "STRUCT",
    ENUM = "ENUM",
    IMPORT = "IMPORT",
    FROM = "FROM",
    ASYNC = "ASYNC",
    AWAIT = "AWAIT",
    SPAWN = "SPAWN",
    BREAK = "BREAK",
    TYPE_INT = "TYPE_INT",
    TYPE_FLOAT = "TYPE_FLOAT",
    TYPE_BOOL = "TYPE_BOOL",
    TYPE_STRING = "TYPE_STRING",
    TYPE_VOID = "TYPE_VOID",
    IDENTIFIER = "IDENTIFIER",
    NUMBER = "NUMBER",
    STRING = "STRING",
    ASSIGN = "ASSIGN",// =
    ARROW = "ARROW",// =>
    COLON = "COLON",// :
    DOT = "DOT",// .
    DOUBLE_COLON = "DOUBLE_COLON",// ::
    DOT_DOT = "DOT_DOT",// ..
    ELLIPSIS = "ELLIPSIS",// ...
    PIPE = "PIPE",// |
    PIPE_OP = "PIPE_OP",// |>
    LPAREN = "LPAREN",// (
    RPAREN = "RPAREN",// )
    LBRACE = "LBRACE",// {
    RBRACE = "RBRACE",// }
    LBRACKET = "LBRACKET",// [
    RBRACKET = "RBRACKET",// ]
    COMMA = "COMMA",// ,
    SEMICOLON = "SEMICOLON",// ;
    PLUS = "PLUS",
    MINUS = "MINUS",
    MULTIPLY = "MULTIPLY",
    DIVIDE = "DIVIDE",
    GT = "GT",// >
    LT = "LT",// <
    BY = "BY",// by
    EOF = "EOF"
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
    private current;
    private peek;
    private advance;
    private createToken;
    private isWhitespace;
    private isAlpha;
    private isDigit;
    private readIdentifier;
    private getKeywordType;
    private readNumber;
    private readString;
    private skipComment;
}
