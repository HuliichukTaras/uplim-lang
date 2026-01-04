import { EngineContext } from '../interface/engine-main'
import { AnalysisResult } from '../analysis/analysis'
import { SecurityReport } from '../security/security'
import { PerfHints } from '../tester/tester'
import { AIRequest, suggestImprovements } from '../ai/ai_client'

export interface EvolutionSuggestions {
  heuristic: string[]
  ai: string[]
  merged: string[]
}

function deriveHeuristicSuggestions(
  analysis: AnalysisResult,
  security: SecurityReport,
  perf: PerfHints
): string[] {
  const suggestions: string[] = []

  // Analysis-based suggestions
  if (analysis.metrics.typesCoverage < 80) {
    suggestions.push('Increase type coverage to improve safety')
  }

  if (analysis.metrics.averageComplexity > 10) {
    suggestions.push('High average function complexity - consider refactoring')
  }

  // Security-based suggestions
  const criticalIssues = security.issues.filter(i => i.severity === 'critical')
  if (criticalIssues.length > 0) {
    suggestions.push(`Found ${criticalIssues.length} critical security issues - address immediately`)
  }

  // Performance-based suggestions
  if (perf.suggestions.length > 0) {
    suggestions.push(...perf.suggestions)
  }

  return suggestions
}

function buildEngineSummary(
  analysis: AnalysisResult,
  security: SecurityReport,
  perf: PerfHints
): string {
  return `
Project Analysis Summary:
- Total Lines: ${analysis.metrics.totalLines}
- Total Functions: ${analysis.metrics.totalFunctions}
- Average Complexity: ${analysis.metrics.averageComplexity.toFixed(2)}
- Type Coverage: ${analysis.metrics.typesCoverage.toFixed(1)}%
- Diagnostics: ${analysis.diagnostics.length}
- Security Issues: ${security.issues.length}
- Performance Metrics: ${perf.metrics.length}

Top Issues:
${analysis.diagnostics.slice(0, 5).map(d => `- ${d.message}`).join('\n')}

Security Concerns:
${security.issues.slice(0, 3).map(i => `- [${i.severity}] ${i.message}`).join('\n')}
  `.trim()
}

function mergeSuggestions(heuristic: string[], ai: string[]): string[] {
  // Combine and deduplicate
  const all = [...heuristic, ...ai]
  const unique = Array.from(new Set(all))
  
  // Sort by priority (critical issues first)
  return unique.sort((a, b) => {
    const aPriority = a.includes('critical') ? 0 : a.includes('security') ? 1 : 2
    const bPriority = b.includes('critical') ? 0 : b.includes('security') ? 1 : 2
    return aPriority - bPriority
  })
}

export function proposeLanguageChanges(
  ctx: EngineContext,
  analysis: AnalysisResult,
  security: SecurityReport,
  perf: PerfHints
): EvolutionSuggestions {
  console.log('[Evolver] Generating language evolution proposals...')

  const heuristic = deriveHeuristicSuggestions(analysis, security, perf)

  if (!ctx.aiClient) {
    console.log('[Evolver] AI disabled, using heuristic suggestions only')
    return {
      heuristic,
      ai: [],
      merged: heuristic
    }
  }

  const summary = buildEngineSummary(analysis, security, perf)

  const aiRequest: AIRequest = {
    kind: 'language-evolution',
    payload: {
      summary,
      constraints: [
        'do not break backward compatibility',
        'never increase syntax complexity unnecessarily',
        'prioritize safety and performance',
        'keep UPLim simple and readable'
      ]
    }
  }

  // Make async call but don't block
  let aiSuggestions: string[] = []
  
  suggestImprovements(ctx.aiClient, aiRequest)
    .then(response => {
      aiSuggestions = response.suggestions
      console.log(`[Evolver] AI provided ${aiSuggestions.length} suggestions`)
    })
    .catch(error => {
      console.error('[Evolver] AI suggestions failed:', error)
    })

  const merged = mergeSuggestions(heuristic, aiSuggestions)

  return {
    heuristic,
    ai: aiSuggestions,
    merged
  }
}

export class Evolver {
  static propose(
    ctx: EngineContext,
    analysis: AnalysisResult,
    security: SecurityReport,
    perf: PerfHints
  ): EvolutionSuggestions {
    return proposeLanguageChanges(ctx, analysis, security, perf)
  }
}
