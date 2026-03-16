export { Lexer, TokenType } from 'uplim-frontend'
export type { Token } from 'uplim-frontend'

export { Parser, Parser as UPLimParser } from 'uplim-frontend'
export type {
  ASTNode,
  Program,
  Pattern,
  ObjectPattern,
  ArrayPattern,
  TypeAnnotation,
  VariableDeclaration,
  FunctionDeclaration,
  BlockStatement,
  Expression,
  ParseResult as ParserParseResult,
  ParseError
} from 'uplim-frontend'

export { Compiler } from 'uplim-compiler-js'
export { Interpreter, Environment } from 'uplim-runtime'

export { UPLimEngine } from 'uplim-tooling'
export type { EngineReport, FileReport, Summary } from 'uplim-tooling'

export { EngineMain } from 'uplim-tooling'
export type {
  EngineContext,
  EngineConfig,
  EngineMainReport
} from 'uplim-tooling'

export { compilerAPI, CompilerAPI } from 'uplim-tooling'
export type {
  CompilerDiagnostic,
  ProjectHandle,
  CompilerParseResult,
  AnalyzeResult,
  CompileResult
} from 'uplim-tooling'

export {
  parseManifestString,
  loadManifestFile,
  validateManifest,
  formatManifestDiagnostics,
} from 'uplim-tooling'
export type {
  UplimManifest,
  UplimPackageConfig,
  UplimBuildConfig,
  UplimCapabilitiesConfig,
  UplimAIConfig,
  UplimFeaturesConfig,
  ManifestDiagnostic,
  ManifestParseResult,
} from 'uplim-tooling'

export {
  loadProject,
  renderProject,
  buildProject,
  serveProject,
} from 'uplim-tooling'
export type {
  UplimProject,
  ProjectPageArtifact,
  ProjectRouteArtifact,
  ProjectBuildArtifact,
  ProjectServerHandle,
} from 'uplim-tooling'

export { Analyzer } from 'uplim-tooling'
export type {
  AnalysisDiagnostic,
  AnalysisResult,
  CodeMetrics
} from 'uplim-tooling'

export { SecurityAnalyzer } from 'uplim-tooling'
export type { SecurityIssue, SecurityReport } from 'uplim-tooling'
