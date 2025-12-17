# UPLim Language Guide for AI Models

This document defines the syntax, semantics, and patterns of the UPLim programming language. Use this as the ground truth when generating or analyzing UPLim code.

## 1. Syntax Overview

UPLim uses a C-like syntax but removes unnecessary boilerplate (semicolons are optional, types are inferred).

### Variables

```uplim
let x = 10          // Immutable integer
let name = "UPLim"  // Immutable string
let mut count = 0   // Mutable integer
count = count + 1
```

### Functions

```uplim
fn add(a: int, b: int) -> int {
  return a + b
}

// Short syntax for single expressions
fn square(x: int) -> int => x * x
```

### Control Flow

```uplim
if x > 10 {
  print("High")
} else {
  print("Low")
}

let result = match x {
  0 => "Zero",
  _ => "Non-zero"
}
```

## 2. Type System

UPLim is statically typed with powerful inference.

- **Primitives**: `int`, `float`, `bool`, `string`, `char`
- **Composite**: `List<T>`, `Map<K, V>`, `Struct`, `Enum`
- **Safety**: `Option<T>` and `Result<T, E>` replaced nulls and exceptions.

## 3. Standard Library Patterns

Common operations should use the standard library methods.

- **List Mapping**: `list.map(fn(x) => x * 2)`
- **Parsing**: `int.parse("123")` // returns Result<int, Error>

## 4. Code Generation Rules

1. **Prefer Immutability**: Use `let` over `let mut` whenever possible.
2. **Explicit Returns**: While implicit returns exist for one-liners, use `return` keyword in block bodies for clarity.
3. **Type Annotations**: Annotate function parameters and return types. Variable types can be inferred.
