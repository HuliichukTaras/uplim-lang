# UPLim Tree-sitter Grammar

This directory contains the canonical editor grammar for frozen UPLim `v0.1`.

Rules:

- compiler semantics remain owned by the language spec and compiler parser
- Tree-sitter owns editor parsing, highlighting, folding, and incremental recovery
- readable word-forms and symbolic forms must be represented in one grammar, not split as dialects

The synchronized human-readable grammar artifact lives in `/spec/v0.1.ebnf`.
