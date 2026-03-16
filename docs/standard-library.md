# UPLim Standard Library Specification

> Early draft. Treat this as exploratory until it is reconciled with `docs/production-architecture.md` and `docs/toolchain-contracts.md`.

## Core Principles

- Zero-cost abstractions
- Memory safety by default
- Cross-platform compatibility
- Async-first design
- No runtime exceptions (Result types)

---

## Module: io

### Console I/O

```uplim
module io

func say(message: String) -> Unit
func sayln(message: String) -> Unit
func read() -> Result<String, IoError>
func readln() -> Result<String, IoError>

type IoError = 
  | EndOfFile
  | InvalidInput
  | PermissionDenied
