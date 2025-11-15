export type RuleKind = 'syntax' | 'style' | 'safety' | 'performance'
export type RuleId = string

export interface RuleContext {
  fileName: string
  projectRoot: string
}

export interface RuleResult {
  diagnostics: Array<{
    message: string
    severity: 'info' | 'warning' | 'error'
    location: any
  }>
}

export interface Rule {
  id: RuleId
  kind: RuleKind
  description: string
  apply: (node: any, ctx: RuleContext) => RuleResult
}

export interface RulesRegistry {
  rules: Rule[]
}

// Syntax Rules
function noImplicitAny(): Rule {
  return {
    id: 'no-implicit-any',
    kind: 'syntax',
    description: 'All variables must have explicit types',
    apply: (node, ctx) => {
      const diagnostics = []
      // Check if variable declaration lacks type annotation
      if (node.type === 'VariableDeclaration' && !node.typeAnnotation) {
        diagnostics.push({
          message: 'Variable must have explicit type annotation',
          severity: 'error' as const,
          location: node.location
        })
      }
      return { diagnostics }
    }
  }
}

// Safety Rules
function noUncheckedConcurrency(): Rule {
  return {
    id: 'no-unchecked-concurrency',
    kind: 'safety',
    description: 'Concurrent operations must use safe primitives',
    apply: (node, ctx) => {
      const diagnostics = []
      if (node.type === 'AsyncOperation' && !node.safetyGuard) {
        diagnostics.push({
          message: 'Async operation must use safe concurrency primitives',
          severity: 'error' as const,
          location: node.location
        })
      }
      return { diagnostics }
    }
  }
}

// Style Rules
function consistentNaming(): Rule {
  return {
    id: 'consistent-naming',
    kind: 'style',
    description: 'Follow UPLim naming conventions',
    apply: (node, ctx) => {
      const diagnostics = []
      if (node.type === 'FunctionDeclaration') {
        const name = node.name
        // Functions should use snake_case
        if (!/^[a-z][a-z0-9_]*$/.test(name)) {
          diagnostics.push({
            message: `Function name '${name}' should use snake_case`,
            severity: 'warning' as const,
            location: node.location
          })
        }
      }
      return { diagnostics }
    }
  }
}

// Performance Rules
function noUnboundedLoops(): Rule {
  return {
    id: 'no-unbounded-loops',
    kind: 'performance',
    description: 'Loops must have clear bounds or guards',
    apply: (node, ctx) => {
      const diagnostics = []
      if (node.type === 'WhileLoop' && !node.guard && !node.maxIterations) {
        diagnostics.push({
          message: 'While loop must have iteration guard or max iterations',
          severity: 'warning' as const,
          location: node.location
        })
      }
      return { diagnostics }
    }
  }
}

export function loadDefaultRules(): RulesRegistry {
  return {
    rules: [
      noImplicitAny(),
      noUncheckedConcurrency(),
      consistentNaming(),
      noUnboundedLoops(),
    ]
  }
}
