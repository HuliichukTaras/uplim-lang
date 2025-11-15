import { EngineContext, ProjectHandle } from '../interface/engine_main'

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityIssue {
  severity: SecuritySeverity
  message: string
  location: any
  category: string
}

export interface SecurityReport {
  issues: SecurityIssue[]
}

function findThreadRisks(ast: any): SecurityIssue[] {
  const issues: SecurityIssue[] = []
  
  function visit(node: any) {
    if (!node) return
    
    // Check for unsafe concurrent access
    if (node.type === 'ConcurrentAccess' && !node.mutex && !node.atomic) {
      issues.push({
        severity: 'high',
        message: 'Concurrent access without synchronization',
        location: node.location,
        category: 'concurrency'
      })
    }
    
    if (node.children) {
      node.children.forEach(visit)
    }
  }
  
  visit(ast)
  return issues
}

function findUnsafeMemoryPatterns(ast: any): SecurityIssue[] {
  const issues: SecurityIssue[] = []
  
  function visit(node: any) {
    if (!node) return
    
    // Check for manual memory management
    if (node.type === 'ManualAlloc') {
      issues.push({
        severity: 'critical',
        message: 'Manual memory allocation detected - use ARC instead',
        location: node.location,
        category: 'memory'
      })
    }
    
    // Check for buffer operations without bounds checking
    if (node.type === 'BufferOperation' && !node.boundsChecked) {
      issues.push({
        severity: 'high',
        message: 'Buffer operation without bounds checking',
        location: node.location,
        category: 'memory'
      })
    }
    
    if (node.children) {
      node.children.forEach(visit)
    }
  }
  
  visit(ast)
  return issues
}

function findUnvalidatedInputs(ast: any): SecurityIssue[] {
  const issues: SecurityIssue[] = []
  
  function visit(node: any) {
    if (!node) return
    
    // Check for unvalidated external inputs
    if (node.type === 'ExternalInput' && !node.validated) {
      issues.push({
        severity: 'medium',
        message: 'External input not validated',
        location: node.location,
        category: 'validation'
      })
    }
    
    if (node.children) {
      node.children.forEach(visit)
    }
  }
  
  visit(ast)
  return issues
}

export function runSecurityScan(ctx: EngineContext, project: ProjectHandle): SecurityReport {
  console.log('[Security] Running security scan...')
  
  const astList = project.loadAllAST()
  const issues: SecurityIssue[] = []

  for (const ast of astList) {
    issues.push(...findThreadRisks(ast))
    issues.push(...findUnsafeMemoryPatterns(ast))
    issues.push(...findUnvalidatedInputs(ast))
  }

  console.log(`[Security] Found ${issues.length} security issues`)

  return { issues }
}

export class Security {
  static runScan(ctx: EngineContext, project: ProjectHandle): SecurityReport {
    return runSecurityScan(ctx, project)
  }
}
