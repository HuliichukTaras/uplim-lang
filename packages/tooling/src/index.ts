export { UPLimEngine } from './engine'
export type { EngineReport, FileReport, Summary, ExecutionResult } from './engine'

export { Analyzer } from './analysis'
export type {
  Diagnostic as AnalysisDiagnostic,
  AnalysisResult,
  CodeMetrics
} from './analysis'

export { SecurityAnalyzer } from './security'
export type { SecurityIssue, SecurityReport } from './security'

export { EngineMain } from './interface/engine-main'

export { compilerAPI, CompilerAPI } from './compiler/api/compiler-api'
export type {
  Diagnostic as CompilerDiagnostic,
  ParseResult as CompilerParseResult,
  AnalyzeResult,
  CompileResult
} from './compiler/api/compiler-api'

export type {
  ProjectHandle,
  EngineConfig,
  EngineContext,
  EngineMainReport,
  ToolingDiagnostic,
  ProjectMetrics,
  PerfMetrics,
  PerfHints
} from './types'
