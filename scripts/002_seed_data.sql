-- Seed initial data for UPLim engine

-- Insert example code snippets
insert into public.code_examples (title, description, code) values
  ('Hello World', 'Simple hello world program', 'say "Hello, World!"'),
  ('Variables', 'Variable declaration and usage', 'let x = 42\nlet name = "Alice"\nsay "Name: " plus name'),
  ('Conditionals', 'Using when/do for conditions', 'let age = 25\nwhen age >= 18 do\n  say "Adult"\nend'),
  ('Functions', 'Function definition and call', 'func greet(name) do\n  say "Hello, " plus name\nend\n\ngreet("World")'),
  ('Math Operations', 'Arithmetic operations', 'let a = 10\nlet b = 20\nlet sum = a + b\nsay "Sum: " plus sum')
on conflict do nothing;

-- Insert evolution history
insert into public.evolution_history (version, title, description, impact, examples) values
  (
    '0.3.0',
    'Pattern Matching System',
    'Added comprehensive pattern matching with match/case syntax',
    'critical',
    '{"before": "if x == 1 then ... elseif x == 2 then ...", "after": "match x do\n  case 1: ...\n  case 2: ...\nend"}'::jsonb
  ),
  (
    '0.2.5',
    'Result Type Enhancement',
    'Improved error handling with Result<T, E> type',
    'high',
    '{"example": "func divide(a: Int, b: Int) -> Result<Int, String>"}'::jsonb
  ),
  (
    '0.2.0',
    'Async/Await Support',
    'Added async functions and await keyword for concurrent operations',
    'high',
    '{"example": "async func fetch_data() -> Data {\n  let result = await http.get(url)\n  return result\n}"}'::jsonb
  ),
  (
    '0.1.5',
    'Trait System',
    'Introduced traits for interface-based polymorphism',
    'medium',
    '{"example": "trait Display {\n  func show(self) -> String\n}"}'::jsonb
  )
on conflict do nothing;
