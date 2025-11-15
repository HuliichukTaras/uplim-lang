// Rules Registry - defines language rules

export interface Rule {
  id: string
  category: 'syntax' | 'style' | 'safety' | 'performance'
  severity: 'error' | 'warning' | 'info'
  message: string
  check: (line: string) => boolean
  suggestion?: string
}

export const UPLIM_RULES: Rule[] = [
  {
    id: 'no-var',
    category: 'syntax',
    severity: 'error',
    message: 'Use "let" instead of "var"',
    check: (line) => line.includes('var '),
    suggestion: 'Replace "var" with "let"'
  },
  {
    id: 'no-null',
    category: 'safety',
    severity: 'warning',
    message: 'Use Option<T> instead of null',
    check: (line) => line.includes('null'),
    suggestion: 'Use Option.None or Option.Some(value)'
  },
  {
    id: 'no-throw',
    category: 'safety',
    severity: 'error',
    message: 'Use Result<T, E> instead of exceptions',
    check: (line) => line.includes('throw '),
    suggestion: 'Return Result.Err(error) instead'
  },
  {
    id: 'prefer-const',
    category: 'style',
    severity: 'info',
    message: 'Variables that are not reassigned should be const',
    check: (line) => line.trim().startsWith('let ') && !line.includes('='),
    suggestion: 'Use const for immutable values'
  }
]
