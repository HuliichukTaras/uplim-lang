# UPLim Rust Workspace

This directory contains the canonical Rust production-compiler path for UPLim.

Current crates:

- `uplimc`: compiler CLI scaffold with the stable command surface
- `uplim_manifest`: `uplim.toml` parsing and validation
- `uplim_parser`: Phase 1 lexer/parser/diagnostics skeleton

This workspace is intentionally dependency-light so the semantic core stays explicit and reviewable while the language is still being frozen.
