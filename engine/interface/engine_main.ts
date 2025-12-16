import { RulesRegistry, loadDefaultRules } from '../rules/rules_registry'
import { runAnalysis, AnalysisResult } from '../analysis/analysis'
import { runSecurityScan, SecurityReport } from '../security/security'
import { maybeBenchmark, PerfHints } from '../tester/tester'
import { proposeLanguageChanges, EvolutionSuggestions } from '../evolver/evolver'
import { StorageHandle, openStorage, saveReport } from '../storage/profile_storage'
import { AIClient, initAIClient } from '../ai/ai_client'

export interface EngineConfig {
  enableAI: boolean
  aiProvider: string
  aiApiKey?: string
  performanceProfilePath: string
}

export interface EngineContext {
  config: EngineConfig
  rules: RulesRegistry
  storage: StorageHandle
  aiClient: AIClient | null
}

export interface ProjectHandle {
  root: string
  loadAllAST: () => any[]
  isBenchmarkEnabled: () => boolean
  discoverBenchmarks: () => any[]
}

export interface EngineReport {
  analysis: AnalysisResult
  security: SecurityReport
  performance: PerfHints
  evolution: EvolutionSuggestions
}

export function initEngine(config: EngineConfig): EngineContext {
  const storage = openStorage(config.performanceProfilePath)
  const rules = loadDefaultRules()
  const aiClient = config.enableAI && config.aiApiKey
    ? initAIClient(config.aiProvider, config.aiApiKey)
    : null

  return {
    config,
    rules,
    storage,
    aiClient,
  }
}

export function analyzeProject(ctx: EngineContext, project: ProjectHandle): EngineReport {
  console.log('[Engine] Starting project analysis...')
  
  const analysisResult = runAnalysis(ctx, project)
  const securityResult = runSecurityScan(ctx, project)
  const perfHints = maybeBenchmark(ctx, project)
  
  const evolution = proposeLanguageChanges(
    ctx,
    analysisResult,
    securityResult,
    perfHints
  )

  saveReport(ctx.storage, project, analysisResult, securityResult, perfHints, evolution)

  console.log('[Engine] Analysis complete')

  return {
    analysis: analysisResult,
    security: securityResult,
    performance: perfHints,
    evolution,
  }
}
