import { AnalysisResult } from '../analysis/analysis'
import { SecurityReport } from '../security/security'
import { PerfHints } from '../tester/tester'
import { EvolutionSuggestions } from '../evolver/evolver'
import { ProjectHandle } from '../interface/engine_main'

export interface StorageHandle {
  path: string
  data: Map<string, any>
}

export interface StoredReport {
  timestamp: number
  projectRoot: string
  analysis: AnalysisResult
  security: SecurityReport
  performance: PerfHints
  evolution: EvolutionSuggestions
}

export function openStorage(path: string): StorageHandle {
  console.log(`[Storage] Opening storage at ${path}`)
  
  return {
    path,
    data: new Map()
  }
}

export function saveReport(
  storage: StorageHandle,
  project: ProjectHandle,
  analysis: AnalysisResult,
  security: SecurityReport,
  perf: PerfHints,
  evolution: EvolutionSuggestions
): void {
  const report: StoredReport = {
    timestamp: Date.now(),
    projectRoot: project.root,
    analysis,
    security,
    performance: perf,
    evolution
  }

  const key = `report_${project.root}_${report.timestamp}`
  storage.data.set(key, report)

  console.log(`[Storage] Saved report with key: ${key}`)
}

export function loadReports(storage: StorageHandle, projectRoot: string): StoredReport[] {
  const reports: StoredReport[] = []

  for (const [key, value] of storage.data.entries()) {
    if (key.startsWith(`report_${projectRoot}_`)) {
      reports.push(value as StoredReport)
    }
  }

  return reports.sort((a, b) => b.timestamp - a.timestamp)
}

export function getLatestReport(storage: StorageHandle, projectRoot: string): StoredReport | null {
  const reports = loadReports(storage, projectRoot)
  return reports.length > 0 ? reports[0] : null
}
