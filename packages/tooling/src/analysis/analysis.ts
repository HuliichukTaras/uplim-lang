import type {
  AnalysisResult,
  EngineContext,
  ProjectHandle,
  ProjectMetrics,
  ToolingDiagnostic
} from '../types'

function walkASTWithRule(ast: any, rule: any): { diagnostics: ToolingDiagnostic[] } {
  const diagnostics: ToolingDiagnostic[] = []
  
  function visit(node: any) {
    if (!node) return
    
    const result = rule.apply(node, { fileName: 'temp.upl', projectRoot: '/' })
    diagnostics.push(...result.diagnostics.map((d: any) => ({
      ...d,
      code: rule.id
    })))
    
    // Recursively visit children
    if (node.children) {
      node.children.forEach(visit)
    }
  }
  
  visit(ast)
  return { diagnostics }
}

function computeProjectMetrics(astList: any[]): ProjectMetrics {
  let totalLines = 0
  let totalFunctions = 0
  let totalComplexity = 0
  let typedDeclarations = 0
  let totalDeclarations = 0

  for (const ast of astList) {
    totalLines += ast.lineCount || 0
    
    function countNodes(node: any) {
      if (!node) return
      
      if (node.type === 'FunctionDeclaration') {
        totalFunctions++
        totalComplexity += node.complexity || 1
      }
      
      if (node.type === 'VariableDeclaration') {
        totalDeclarations++
        if (node.typeAnnotation) typedDeclarations++
      }
      
      if (node.children) {
        node.children.forEach(countNodes)
      }
    }
    
    countNodes(ast)
  }

  return {
    totalLines,
    totalFunctions,
    averageComplexity: totalFunctions > 0 ? totalComplexity / totalFunctions : 0,
    typesCoverage: totalDeclarations > 0 ? (typedDeclarations / totalDeclarations) * 100 : 100
  }
}

export function runAnalysis(ctx: EngineContext, project: ProjectHandle): AnalysisResult {
  console.log('[Analysis] Running static analysis...')
  
  const astList = project.load_all_ast()
  const diagnostics: ToolingDiagnostic[] = []

  for (const ast of astList) {
    for (const rule of ctx.rules.rules) {
      const result = walkASTWithRule(ast, rule)
      diagnostics.push(...result.diagnostics)
    }
  }

  const metrics = computeProjectMetrics(astList)

  console.log(`[Analysis] Found ${diagnostics.length} issues, metrics computed`)

  return {
    diagnostics,
    metrics
  }
}

export class Analysis {
  static run(ctx: EngineContext, project: ProjectHandle): AnalysisResult {
    return runAnalysis(ctx, project)
  }
}
