use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Span {
    pub line: usize,
    pub column: usize,
    pub length: usize,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SourceFile {
    pub path: PathBuf,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Severity {
    Warning,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Diagnostic {
    pub code: &'static str,
    pub message: String,
    pub severity: Severity,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub enum TokenKind {
    Let,
    Say,
    Import,
    Func,
    Return,
    If,
    Else,
    Identifier(String),
    Number(String),
    String(String),
    Equals,
    Dot,
    Semicolon,
    Comma,
    LParen,
    RParen,
    LBrace,
    RBrace,
    Newline,
    Eof,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Token {
    pub kind: TokenKind,
    pub span: Span,
}

#[derive(Debug, Clone, PartialEq)]
pub enum Expr {
    Identifier { name: String, span: Span },
    String { value: String, span: Span },
    Number { value: String, span: Span },
    Call {
        callee: Box<Expr>,
        arguments: Vec<Expr>,
        span: Span,
    },
}

#[derive(Debug, Clone, PartialEq)]
pub enum Statement {
    Let {
        name: String,
        value: Expr,
        span: Span,
    },
    Say {
        value: Expr,
        span: Span,
    },
    Import {
        source: String,
        span: Span,
    },
    Function {
        name: String,
        parameters: Vec<String>,
        body: Vec<Statement>,
        span: Span,
    },
    Return {
        value: Option<Expr>,
        span: Span,
    },
    If {
        condition: Expr,
        then_branch: Vec<Statement>,
        else_branch: Vec<Statement>,
        span: Span,
    },
    Expr {
        value: Expr,
        span: Span,
    },
}

#[derive(Debug, Clone, PartialEq)]
pub struct Program {
    pub source: SourceFile,
    pub statements: Vec<Statement>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ParseOutput {
    pub program: Option<Program>,
    pub diagnostics: Vec<Diagnostic>,
}

fn diagnostic(code: &'static str, message: impl Into<String>, span: Span) -> Diagnostic {
    Diagnostic {
        code,
        message: message.into(),
        severity: Severity::Error,
        span,
    }
}

fn is_identifier_start(ch: char) -> bool {
    ch.is_ascii_alphabetic() || ch == '_'
}

fn is_identifier_continue(ch: char) -> bool {
    ch.is_ascii_alphanumeric() || ch == '_'
}

pub fn lex(source: &str) -> (Vec<Token>, Vec<Diagnostic>) {
    let mut tokens = Vec::new();
    let mut diagnostics = Vec::new();
    let mut chars = source.chars().peekable();
    let mut line = 1usize;
    let mut column = 1usize;

    while let Some(ch) = chars.peek().copied() {
        match ch {
            ' ' | '\t' | '\r' => {
                chars.next();
                column += 1;
            }
            '\n' => {
                tokens.push(Token {
                    kind: TokenKind::Newline,
                    span: Span { line, column, length: 1 },
                });
                chars.next();
                line += 1;
                column = 1;
            }
            '=' => {
                tokens.push(Token {
                    kind: TokenKind::Equals,
                    span: Span { line, column, length: 1 },
                });
                chars.next();
                column += 1;
            }
            '.' => {
                tokens.push(Token {
                    kind: TokenKind::Dot,
                    span: Span { line, column, length: 1 },
                });
                chars.next();
                column += 1;
            }
            ';' => {
                tokens.push(Token {
                    kind: TokenKind::Semicolon,
                    span: Span { line, column, length: 1 },
                });
                chars.next();
                column += 1;
            }
            ',' => {
                tokens.push(Token {
                    kind: TokenKind::Comma,
                    span: Span { line, column, length: 1 },
                });
                chars.next();
                column += 1;
            }
            '(' => {
                tokens.push(Token {
                    kind: TokenKind::LParen,
                    span: Span { line, column, length: 1 },
                });
                chars.next();
                column += 1;
            }
            ')' => {
                tokens.push(Token {
                    kind: TokenKind::RParen,
                    span: Span { line, column, length: 1 },
                });
                chars.next();
                column += 1;
            }
            '{' => {
                tokens.push(Token {
                    kind: TokenKind::LBrace,
                    span: Span { line, column, length: 1 },
                });
                chars.next();
                column += 1;
            }
            '}' => {
                tokens.push(Token {
                    kind: TokenKind::RBrace,
                    span: Span { line, column, length: 1 },
                });
                chars.next();
                column += 1;
            }
            '"' => {
                let start = Span { line, column, length: 1 };
                chars.next();
                column += 1;
                let mut value = String::new();
                let mut terminated = false;
                while let Some(next) = chars.next() {
                    column += 1;
                    match next {
                        '"' => {
                            terminated = true;
                            break;
                        }
                        '\\' => {
                            let Some(escaped) = chars.next() else {
                                break;
                            };
                            column += 1;
                            match escaped {
                                '"' => value.push('"'),
                                '\\' => value.push('\\'),
                                'n' => value.push('\n'),
                                't' => value.push('\t'),
                                other => {
                                    diagnostics.push(diagnostic(
                                        "LEX_INVALID_ESCAPE",
                                        format!("Unsupported escape sequence \\{}.", other),
                                        start,
                                    ));
                                }
                            }
                        }
                        '\n' => {
                            line += 1;
                            column = 1;
                            value.push('\n');
                        }
                        other => value.push(other),
                    }
                }
                if !terminated {
                    diagnostics.push(diagnostic("LEX_UNTERMINATED_STRING", "String literal is not terminated.", start));
                } else {
                    tokens.push(Token {
                        kind: TokenKind::String(value),
                        span: start,
                    });
                }
            }
            ch if ch.is_ascii_digit() => {
                let start_column = column;
                let mut value = String::new();
                while let Some(next) = chars.peek().copied() {
                    if !next.is_ascii_digit() && next != '.' {
                        break;
                    }
                    value.push(next);
                    chars.next();
                    column += 1;
                }
                tokens.push(Token {
                    kind: TokenKind::Number(value.clone()),
                    span: Span {
                        line,
                        column: start_column,
                        length: value.len(),
                    },
                });
            }
            ch if is_identifier_start(ch) => {
                let start_column = column;
                let mut value = String::new();
                while let Some(next) = chars.peek().copied() {
                    if !is_identifier_continue(next) {
                        break;
                    }
                    value.push(next);
                    chars.next();
                    column += 1;
                }
                let kind = match value.as_str() {
                    "let" => TokenKind::Let,
                    "say" => TokenKind::Say,
                    "import" => TokenKind::Import,
                    "fn" | "func" => TokenKind::Func,
                    "return" | "ret" => TokenKind::Return,
                    "if" => TokenKind::If,
                    "else" => TokenKind::Else,
                    _ => TokenKind::Identifier(value.clone()),
                };
                tokens.push(Token {
                    kind,
                    span: Span {
                        line,
                        column: start_column,
                        length: value.len(),
                    },
                });
            }
            other => {
                diagnostics.push(diagnostic(
                    "LEX_UNEXPECTED_CHARACTER",
                    format!("Unexpected character '{}'.", other),
                    Span { line, column, length: 1 },
                ));
                chars.next();
                column += 1;
            }
        }
    }

    tokens.push(Token {
        kind: TokenKind::Eof,
        span: Span {
            line,
            column,
            length: 0,
        },
    });
    (tokens, diagnostics)
}

struct ParserState {
    tokens: Vec<Token>,
    cursor: usize,
    diagnostics: Vec<Diagnostic>,
}

impl ParserState {
    fn current(&self) -> &Token {
        &self.tokens[self.cursor]
    }

    fn advance(&mut self) {
        if self.cursor < self.tokens.len().saturating_sub(1) {
            self.cursor += 1;
        }
    }

    fn skip_separators(&mut self) {
        while matches!(self.current().kind, TokenKind::Newline | TokenKind::Semicolon) {
            self.advance();
        }
    }

    fn current_span(&self) -> Span {
        self.current().span
    }

    fn consume_simple(&mut self, expected: TokenKind, code: &'static str, message: &str) -> bool {
        if self.current().kind == expected {
            self.advance();
            true
        } else {
            self.diagnostics
                .push(diagnostic(code, message, self.current_span()));
            false
        }
    }

    fn parse_identifier(&mut self, code: &'static str, message: &str) -> Option<(String, Span)> {
        match self.current().kind.clone() {
            TokenKind::Identifier(name) => {
                let span = self.current_span();
                self.advance();
                Some((name, span))
            }
            _ => {
                self.diagnostics
                    .push(diagnostic(code, message, self.current_span()));
                None
            }
        }
    }

    fn parse_identifier_path(&mut self) -> Option<(String, Span)> {
        let mut span = self.current().span;
        let TokenKind::Identifier(first) = self.current().kind.clone() else {
            self.diagnostics.push(diagnostic(
                "PARSE_EXPECTED_IDENTIFIER",
                "Expected identifier.",
                self.current().span,
            ));
            return None;
        };
        self.advance();
        let mut value = first;
        while matches!(self.current().kind, TokenKind::Dot) {
            self.advance();
            match self.current().kind.clone() {
                TokenKind::Identifier(segment) => {
                    span.length += 1 + segment.len();
                    value.push('.');
                    value.push_str(&segment);
                    self.advance();
                }
                _ => {
                    self.diagnostics.push(diagnostic(
                        "PARSE_EXPECTED_IDENTIFIER",
                        "Expected identifier after '.'.",
                        self.current().span,
                    ));
                    return None;
                }
            }
        }
        Some((value, span))
    }

    fn finish_call(&mut self, callee: Expr) -> Option<Expr> {
        let start = match &callee {
            Expr::Identifier { span, .. }
            | Expr::String { span, .. }
            | Expr::Number { span, .. }
            | Expr::Call { span, .. } => *span,
        };

        let mut arguments = Vec::new();
        if !matches!(self.current().kind, TokenKind::RParen) {
            loop {
                arguments.push(self.parse_expr()?);
                if !matches!(self.current().kind, TokenKind::Comma) {
                    break;
                }
                self.advance();
            }
        }

        if !self.consume_simple(
            TokenKind::RParen,
            "PARSE_EXPECTED_RPAREN",
            "Expected ')' after call arguments.",
        ) {
            return None;
        }

        Some(Expr::Call {
            callee: Box::new(callee),
            arguments,
            span: start,
        })
    }

    fn parse_expr(&mut self) -> Option<Expr> {
        match self.current().kind.clone() {
            TokenKind::Identifier(name) => {
                let span = self.current().span;
                self.advance();
                let mut expr = Expr::Identifier { name, span };
                while matches!(self.current().kind, TokenKind::LParen) {
                    self.advance();
                    expr = self.finish_call(expr)?;
                }
                Some(expr)
            }
            TokenKind::String(value) => {
                let span = self.current().span;
                self.advance();
                Some(Expr::String { value, span })
            }
            TokenKind::Number(value) => {
                let span = self.current().span;
                self.advance();
                Some(Expr::Number { value, span })
            }
            _ => {
                self.diagnostics.push(diagnostic(
                    "PARSE_EXPECTED_EXPRESSION",
                    "Expected expression.",
                    self.current().span,
                ));
                None
            }
        }
    }

    fn parse_block(&mut self) -> Option<Vec<Statement>> {
        if !self.consume_simple(TokenKind::LBrace, "PARSE_EXPECTED_LBRACE", "Expected '{'.") {
            return None;
        }

        let mut statements = Vec::new();
        loop {
            self.skip_separators();
            match self.current().kind {
                TokenKind::RBrace => {
                    self.advance();
                    break;
                }
                TokenKind::Eof => {
                    self.diagnostics.push(diagnostic(
                        "PARSE_UNTERMINATED_BLOCK",
                        "Expected '}' before end of file.",
                        self.current_span(),
                    ));
                    return None;
                }
                _ => statements.push(self.parse_statement()?),
            }
        }

        Some(statements)
    }

    fn parse_function(&mut self) -> Option<Statement> {
        let span = self.current_span();
        self.advance();
        let (name, _) = self.parse_identifier(
            "PARSE_EXPECTED_FUNCTION_NAME",
            "Expected function name after 'fn'.",
        )?;

        if !self.consume_simple(
            TokenKind::LParen,
            "PARSE_EXPECTED_LPAREN",
            "Expected '(' after function name.",
        ) {
            return None;
        }

        let mut parameters = Vec::new();
        if !matches!(self.current().kind, TokenKind::RParen) {
            loop {
                let (parameter, _) = self.parse_identifier(
                    "PARSE_EXPECTED_PARAMETER",
                    "Expected parameter name.",
                )?;
                parameters.push(parameter);
                if !matches!(self.current().kind, TokenKind::Comma) {
                    break;
                }
                self.advance();
            }
        }

        if !self.consume_simple(
            TokenKind::RParen,
            "PARSE_EXPECTED_RPAREN",
            "Expected ')' after parameter list.",
        ) {
            return None;
        }

        let body = self.parse_block()?;
        Some(Statement::Function {
            name,
            parameters,
            body,
            span,
        })
    }

    fn parse_return(&mut self) -> Option<Statement> {
        let span = self.current_span();
        self.advance();

        if matches!(
            self.current().kind,
            TokenKind::Semicolon | TokenKind::Newline | TokenKind::RBrace | TokenKind::Eof
        ) {
            return Some(Statement::Return { value: None, span });
        }

        let value = self.parse_expr()?;
        Some(Statement::Return {
            value: Some(value),
            span,
        })
    }

    fn parse_if(&mut self) -> Option<Statement> {
        let span = self.current_span();
        self.advance();
        let condition = self.parse_expr()?;
        let then_branch = self.parse_block()?;
        let else_branch = if matches!(self.current().kind, TokenKind::Else) {
            self.advance();
            self.parse_block()?
        } else {
            Vec::new()
        };

        Some(Statement::If {
            condition,
            then_branch,
            else_branch,
            span,
        })
    }

    fn parse_statement(&mut self) -> Option<Statement> {
        self.skip_separators();
        match self.current().kind.clone() {
            TokenKind::Let => {
                let start = self.current().span;
                self.advance();
                let (name, _) = self.parse_identifier_path()?;
                if !matches!(self.current().kind, TokenKind::Equals) {
                    self.diagnostics.push(diagnostic(
                        "PARSE_EXPECTED_EQUALS",
                        "Expected '=' after binding name.",
                        self.current().span,
                    ));
                    return None;
                }
                self.advance();
                let value = self.parse_expr()?;
                Some(Statement::Let {
                    name,
                    value,
                    span: start,
                })
            }
            TokenKind::Say => {
                let span = self.current().span;
                self.advance();
                let value = self.parse_expr()?;
                Some(Statement::Say { value, span })
            }
            TokenKind::Import => {
                let span = self.current().span;
                self.advance();
                let (source, _) = self.parse_identifier_path()?;
                Some(Statement::Import { source, span })
            }
            TokenKind::Func => self.parse_function(),
            TokenKind::Return => self.parse_return(),
            TokenKind::If => self.parse_if(),
            TokenKind::Eof => None,
            _ => {
                let expr = self.parse_expr()?;
                let span = match &expr {
                    Expr::Identifier { span, .. }
                    | Expr::String { span, .. }
                    | Expr::Number { span, .. }
                    | Expr::Call { span, .. } => *span,
                };
                Some(Statement::Expr { value: expr, span })
            }
        }
    }
}

pub fn parse(source: &str, file: impl AsRef<Path>) -> ParseOutput {
    let source_file = SourceFile {
        path: file.as_ref().to_path_buf(),
    };
    let (tokens, mut diagnostics) = lex(source);
    let mut state = ParserState {
        tokens,
        cursor: 0,
        diagnostics: Vec::new(),
    };

    let mut statements = Vec::new();
    loop {
        state.skip_separators();
        if matches!(state.current().kind, TokenKind::Eof) {
            break;
        }

        match state.parse_statement() {
            Some(statement) => statements.push(statement),
            None => {
                if matches!(state.current().kind, TokenKind::Eof) {
                    break;
                }
                state.advance();
            }
        }
        state.skip_separators();
    }

    diagnostics.extend(state.diagnostics);
    if diagnostics.iter().any(|diag| diag.severity == Severity::Error) {
        return ParseOutput {
            program: None,
            diagnostics,
        };
    }

    ParseOutput {
        program: Some(Program {
            source: source_file,
            statements,
        }),
        diagnostics,
    }
}

pub fn format_diagnostics(diagnostics: &[Diagnostic], file: &Path) -> Vec<String> {
    diagnostics
        .iter()
        .map(|diag| {
            format!(
                "{}:{}:{} [{}] {}",
                file.display(),
                diag.span.line,
                diag.span.column,
                diag.code,
                diag.message
            )
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lexes_basic_tokens() {
        let (tokens, diagnostics) = lex("let answer = 42\nsay \"ok\"");
        assert!(diagnostics.is_empty());
        assert!(matches!(tokens[0].kind, TokenKind::Let));
        assert!(matches!(tokens[1].kind, TokenKind::Identifier(_)));
        assert!(matches!(tokens[3].kind, TokenKind::Number(_)));
    }

    #[test]
    fn parses_minimal_program() {
        let output = parse(
            "import ai.tools\nlet answer = 42\nfn greet(name) { say name }\nsay greet(\"ready\")\n",
            "main.upl",
        );
        assert!(output.diagnostics.is_empty());
        let program = output.program.expect("program");
        assert_eq!(program.statements.len(), 4);
    }

    #[test]
    fn reports_parse_errors() {
        let output = parse("let = 42", "main.upl");
        assert!(output.program.is_none());
        assert!(!output.diagnostics.is_empty());
        assert_eq!(output.diagnostics[0].code, "PARSE_EXPECTED_IDENTIFIER");
    }

    #[test]
    fn parses_if_and_return() {
        let output = parse(
            "fn main() {\n  if ready {\n    return answer\n  } else {\n    return fallback\n  }\n}\n",
            "main.upl",
        );
        assert!(output.diagnostics.is_empty());
        let program = output.program.expect("program");
        assert_eq!(program.statements.len(), 1);
    }
}
