import type { AIClient } from './ai/ai-client'
import type { RulesRegistry } from './rules/rules-registry'
import type { ProfileStorage } from './storage/profile-storage'

export interface ProjectHandle {
  root: string
  load_all_ast(): any[]
  is_benchmark_enabled(): boolean
  discover_benchmarks(): any[]
}

export interface ToolingDiagnostic {
  message: string
  severity: 'info' | 'warning' | 'error'
  location: any
  code: string
}

export interface ProjectMetrics {
  totalLines: number
  totalFunctions: number
  averageComplexity: number
  typesCoverage: number
}

export interface AnalysisResult {
  diagnostics: ToolingDiagnostic[]
  metrics: ProjectMetrics
}

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

export interface PerfMetrics {
  functionName: string
  avgTimeNs: number
  maxTimeNs: number
  memoryBytes: number
}

export interface PerfHints {
  metrics: PerfMetrics[]
  suggestions: string[]
}

export interface EngineConfig {
  enableAI: boolean
  aiProvider: string
  aiApiKey: string | null
  performanceProfilePath: string
}

export interface EngineContext {
  config: EngineConfig
  rules: RulesRegistry
  storage: ProfileStorage
  aiClient: AIClient | null
}

export interface EngineMainReport {
  analysis: AnalysisResult
  security: SecurityReport
  performance: PerfHints
  evolution: string[]
}
