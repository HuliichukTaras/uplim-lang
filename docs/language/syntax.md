# UPLim v0.1 Language Specification

This document defines the official syntax for UPLim v0.1.
The language is designed to be expressive, simple, safe, and strongly typed. It supports two modes: **Full Syntax** (beginner-friendly) and **Short Syntax** (expert-friendly).

## 1. Syntax Basics

### Variables and Constants

```upl
let name = "Uplim"       // Variable (type inferred)
let age: Int = 25        // Variable with explicit type
const PI: Float = 3.1415 // Constant
```

## 2. Control Flow

### If / Else

```upl
if age > 18 {
    print("Adult")
} else {
    print("Minor")
}
```

### Match (Switch)

Values can be matched against patterns.

```upl
match value {
    1 => print("One"),
    2 => print("Two"),
    _ => print("Other")
}
```

### Loops

```upl
// While Loop
while count < 10 {
    count += 1
}

// Infinite Loop
loop {
    break
}

// For Loop (Iterator)
for item in array {
    print(item)
}
```

## 3. Functions

### Declaration

Functions are declared with `func`. Return types are specified with `->` or `:`.

```upl
func greet(name: String) -> String {
    return "Hello, \(name)" // String interpolation
}

func sum(a: Int, b: Int): Int {
    a + b // Implicit return
}
```

## 4. Structures and Types

### Structs

```upl
struct User {
    name: String
    age: Int
}

let user = User(name: "Ivan", age: 30)
print(user.name)
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

## 5. Async / Await

Native support for asynchronous programming.

```upl
async func fetchData(): Result<Data, Error> {
    let data = await http.get("https://api")
    return Ok(data)
}
```

## 6. Type System

UPLim is null-safe.

- **Primitives**: `Int`, `Float`, `Bool`, `String`, `Char`
- **Generics**: `List<T>`, `Map<K, V>`
- **Safety**: `Option<T>`, `Result<T, E>`

## 7. Modules and Packages

### Imports

```upl
import math
import net::http
from crypto import hash
```

### Formatting

```bash
uplim install http
uplim publish
```

## 8. Advanced Features

### Concurrency

```upl
spawn worker()   // Creates a coroutine
await worker     // Waits for result
```

### Macros (Planned)

```upl
macro debug(expr) {
    print("Debug:", expr)
}
```

## 9. Short Syntax (Power User Mode)

Designed for speed and conciseness.

- `f` = `func`
- `l` = `let`
- `m` = `match`
- `=>` = Single expression body

```upl
// Function
f add(a: Int, b: Int): Int => a + b

// Variable
l nums = [1, 2, 3]

// Match
m r = match x { 1 => "one", _ => "?" }
```

## 10. Example Program

## 11. Advanced Features (v0.2)

### Destructuring

```upl
let person = { name: "Alice", age: 30 }
let { name, age } = person
let [x, y] = [10, 20]
```

### Comprehensions

```upl
let squares = [x * x | x in numbers, x % 2 == 0]
let userMap = { user.id: user.name | user in users }
```

### Pipelines (`|>`)

Pass result of one function to the next.

```upl
let result = 5 |> double |> addOne
```

### Range & Step

```upl
let evens = 0..10 by 2
```

### Enhanced Enum & Match

Enums can hold data. Match supports guards and destructuring.

```upl
enum Shape { Circle(radius: Float), Rect(w: Float, h: Float) }

match shape {
    Shape::Circle(r) if r > 10 => "Big Circle",
    Shape::Rect(w, h) => "Rectangle",
    _ => "Other"
}
```
