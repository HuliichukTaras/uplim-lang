// UPLim Language Syntax Specification v0.1
export const UPLIM_SYNTAX = {
  version: "0.1",
  modes: {
    full: "Full Syntax - зрозумілий для новачків",
    short: "Short Syntax - для досвідчених розробників"
  },

  // 1. Основи
  variables: {
    mutable: "let",
    immutable: "const",
    typeAnnotation: ":",
    assignment: "=",
    examples: [
      'let name = "Uplim"',
      'let age: Int = 25',
      'const PI: Float = 3.1415'
    ]
  },

  // 2. Типи
  types: {
    primitives: ["Int", "Float", "Bool", "String", "Char"],
    collections: ["List<T>", "Map<K,V>", "Set<T>"],
    special: ["Option<T>", "Result<T,E>"],
    examples: [
      'let numbers: List<Int> = [1, 2, 3]',
      'let result: Result<String, Error> = Ok("success")',
      'let maybe: Option<Int> = Some(42)'
    ]
  },

  // 3. Функції
  functions: {
    keyword: "func",
    returnType: ["->", ":"],
    returnKeyword: "return",
    examples: [
      'func greet(name: String) -> String { return "Hello, \\(name)" }',
      'func sum(a: Int, b: Int): Int { a + b }'
    ]
  },

  // 4. Управління потоком
  control: {
    if: { keyword: "if", else: "else" },
    match: { keyword: "match", wildcard: "_", arrow: "=>" },
    while: { keyword: "while" },
    loop: { keyword: "loop", break: "break", continue: "continue" },
    for: { keyword: "for", in: "in" },
    examples: [
      'if age > 18 { print("Adult") }',
      'match value { 1 => print("One"), _ => print("Other") }',
      'for item in array { print(item) }'
    ]
  },

  // 5. Структури
  structs: {
    keyword: "struct",
    examples: [
      'struct User { name: String, age: Int }',
      'let user = User(name: "Ivan", age: 30)'
    ]
  },

  // 6. Перерахування
  enums: {
    keyword: "enum",
    scopeOperator: "::",
    examples: [
      'enum Role { Admin, User, Guest }',
      'let role = Role::User'
    ]
  },

  // 7. Асинхронність
  async: {
    keywords: ["async", "await"],
    examples: [
      'async func fetchData(): Result<Data, Error> { let data = await http.get("https://api"); return Ok(data) }'
    ]
  },

  // 8. Модулі
  modules: {
    import: "import",
    from: "from",
    examples: [
      'import math',
      'import net::http',
      'from crypto import hash'
    ]
  },

  // 9. Пакети
  packages: {
    install: "uplim install",
    publish: "uplim publish"
  },

  // 10. Корутини
  concurrency: {
    spawn: "spawn",
    await: "await",
    examples: [
      'spawn worker()',
      'await worker'
    ]
  },

  // 11. Short Syntax
  shortSyntax: {
    func: "f",
    let: "l",
    match: "m",
    examples: [
      'f add(a: Int, b: Int): Int => a + b',
      'l nums = [1, 2, 3]',
      'm r = match x { 1 => "one", _ => "?" }'
    ]
  },

  // String interpolation
  stringInterpolation: {
    syntax: "\\(expression)",
    example: '"Hello, \\(name)"'
  }
} as const;

// Keywords that MUST NOT be used (from other languages)
export const FORBIDDEN_KEYWORDS = [
  'var', 'console.log', 'printf', 'cout', 'print!', 'println!',
  'function', 'def', 'fn', 'null', 'undefined', 'None', 'nil'
] as const;

// UPLim-specific keywords
export const UPLIM_KEYWORDS = [
  'let', 'const', 'func', 'struct', 'enum', 'match',
  'if', 'else', 'while', 'loop', 'for', 'in',
  'async', 'await', 'spawn', 'import', 'from',
  'return', 'break', 'continue',
  'Int', 'Float', 'Bool', 'String', 'Char',
  'List', 'Map', 'Set', 'Option', 'Result',
  'Some', 'None', 'Ok', 'Err'
] as const;
