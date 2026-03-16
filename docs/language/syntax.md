# UPLim Syntax Guide

This document defines the readable, canonical syntax direction for UPLim.

UPLim should have one normal, consistent syntax for everyone.
It may include a few short aliases, but it should not split into separate "simple" and "progressive" language variants.

## 1. Design Goals

UPLim syntax should be:

- readable on first pass
- easy to write without visual noise
- expressive enough for application code
- structurally clear for tooling, formatting, and diagnostics
- familiar in some places, but not a copy of an existing language

The earliest UPLim direction also emphasized readable keyword-style code such as `be`, `plus`, `equals`, and `when ... do`.
That style remains valid where it improves clarity and should be treated as part of the main language, not as a legacy side mode.

## 2. Declarations

### Variables and constants

```upl
let name = "UPLim"
let age: Int = 25
const pi: Float = 3.1415
```

Readable form:

```upl
let name be "UPLim"
```

Short alias:

```upl
l count = 3
```

### Functions

Canonical forms:

```upl
fn greet(name: String) -> String {
  return "Hello, \(name)"
}

func sum(a: Int, b: Int): Int {
  return a + b
}
```

Short alias:

```upl
f add(a, b) => a + b
```

## 3. Control Flow

### If and else

```upl
if age > 18 {
  print("Adult")
} else {
  print("Minor")
}
```

Readable conditional form:

```upl
when age equals 18 do
  say "Adult"
```

### Match

```upl
match value {
  1 => "one",
  2 => "two",
  _ => "other"
}
```

Short alias:

```upl
let status = m code {
  200 => "ok",
  _ => "error"
}
```

### Loops

```upl
while count < 10 {
  count += 1
}

loop {
  break
}

for item in items {
  print(item)
}
```

## 4. Data Shapes

### Structs

```upl
struct User {
  name: String
  age: Int
}

let user = User(name: "Ivan", age: 30)
print(user.name)
```

### State and immutable update

```upl
state AppState {
  message: String
  visits: Int
}

let app = AppState { message: "Hello", visits: 0 }
let next = app with { visits: app.visits + 1 }
```

### Enums

```upl
enum Role {
  Admin,
  User,
  Guest
}

let role = Role::User
```

## 5. Async and Concurrency

```upl
async func fetchData(): Result<Data, Error> {
  let data = await http.get("https://api")
  return Ok(data)
}

spawn worker()
await worker
```

## 6. Collections and Expressions

### Destructuring

```upl
let person = { name: "Alice", age: 30 }
let { name, age } = person
let [x, y] = [10, 20]
```

### Comprehensions

```upl
let squares = [x * x | x in numbers, x % 2 == 0]
let user_map = { user.id: user.name | user in users }
```

### Pipelines

```upl
let result = 5 |> double |> add_one
```

### Ranges

```upl
let evens = 0..10 by 2
```

## 7. Imports

```upl
import math
import net.http
from crypto import hash
```

## 8. Output

Canonical forms:

```upl
say result
print(result)
```

Short alias:

```upl
p result
```

Readable expression form:

```upl
say "Hello" plus name
```

## 9. Alias Policy

Short aliases are part of the same language, not a separate mode.

Current stable aliases:

- `l` for `let`
- `f` for `fn` and `func`
- `p` for `say` and `print`
- `m` for `match`

Aliases should remain limited.
UPLim should not reserve common one-letter names such as `r`, `x`, or `i` unless the value is clearly worth the compatibility cost.

Readable word operators are also part of the main syntax where supported:

- `be` for assignment in declarations
- `plus` for addition and string concatenation
- `equals` for equality checks

## 10. Direction

UPLim syntax should continue moving toward:

- fewer noisy keywords
- clearer blocks and expressions
- stronger pattern matching
- readable type annotations
- one consistent style across backend, frontend, AI, and tooling code

It should not move toward:

- two parallel dialects
- symbolic density that hurts readability
- syntax designed around copying another language
