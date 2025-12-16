// UPLim Engine - orchestrates all analysis modules

import * as fs from 'fs'
import * as path from 'path'
import { UPLimParser, Program } from './parser'
import { Interpreter } from './interpreter'
import { Analyzer, Diagnostic, CodeMetrics } from './analysis'
import { SecurityAnalyzer, SecurityIssue } from './security'
import { Storage } from './storage'
import { AIAnalyzer, AIAnalysis } from './ai'

export interface EngineReport {
  timestamp: string
  projectPath: string
  files: FileReport[]
  summary: Summary
  aiAnalysis?: AIAnalysis
}

export interface FileReport {
  path: string
  diagnostics: Diagnostic[]
  security: SecurityIssue[]
  metrics: CodeMetrics
}

export interface Summary {
  totalFiles: number
  totalDiagnostics: number
  errorCount: number
  warningCount: number
  securityScore: number
  averageComplexity: number
}

export class UPLimEngine {
  private parser = new UPLimParser()
  private interpreter = new Interpreter()
  private analyzer = new Analyzer()
  private securityAnalyzer = new SecurityAnalyzer()
  private aiAnalyzer = new AIAnalyzer()
  private storage: Storage

  constructor(projectRoot: string) {
    this.storage = new Storage(projectRoot)
  }

  async analyze(targetPath: string, options: { ai?: boolean } = {}): Promise<EngineReport> {
    console.log(`[Engine] Analyzing: ${targetPath}`)
    
    const files = this.findUPLimFiles(targetPath)
    console.log(`[Engine] Found ${files.length} .upl files`)

    const fileReports: FileReport[] = []
    
    for (const file of files) {
      console.log(`[Engine] Processing: ${file}`)
      const report = this.analyzeFile(file)
      fileReports.push(report)
    }

    const summary = this.generateSummary(fileReports)
    
    const report: EngineReport = {
      timestamp: new Date().toISOString(),
      projectPath: targetPath,
      files: fileReports,
      summary
    }

    // Optional AI analysis
    if (options.ai) {
      console.log('[Engine] Running AI analysis...')
      report.aiAnalysis = await this.aiAnalyzer.analyze(JSON.stringify(summary))
    }

    // Save report
    const reportPath = this.storage.saveReport(report)
    console.log(`[Engine] Report saved: ${reportPath}`)

    return report
  }
  
  execute(source: string): string[] {
      const parseResult = this.parser.parse(source, 'exec.upl')
      if (parseResult.errors.length > 0) {
          const err = parseResult.errors[0]
          throw new Error(`Parse Error: ${err.message} at line ${err.line}:${err.column}`)
      }
      return this.interpreter.evaluate(parseResult.ast)
  }

  private analyzeFile(filepath: string): FileReport {
    const source = fs.readFileSync(filepath, 'utf-8')
    
    // Parse
    const parseResult = this.parser.parse(source, filepath)
    
    // Analyze
    const analysisResult = this.analyzer.analyze(parseResult, source, filepath)
    
    // Security scan
    // Note: Security analyzer expects ASTNode but Program is compatible
    const securityReport = this.securityAnalyzer.analyze(parseResult.ast, source, filepath)

    return {
      path: filepath,
      diagnostics: analysisResult.diagnostics,
      security: securityReport.issues,
      metrics: analysisResult.metrics
    }
  }

  private findUPLimFiles(targetPath: string): string[] {
    const files: string[] = []
    
    const traverse = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            try {
              traverse(fullPath)
            } catch (e) {
                // Ignore errors accessing restricted directories
            }
        } else if (entry.isFile() && entry.name.endsWith('.upl')) {
          files.push(fullPath)
        }
      }
    }

    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
      traverse(targetPath)
    } else if (targetPath.endsWith('.upl') && fs.existsSync(targetPath)) {
      files.push(targetPath)
    }

    return files
  }

  private generateSummary(fileReports: FileReport[]): Summary {
    let totalDiagnostics = 0
    let errorCount = 0
    let warningCount = 0
    let totalComplexity = 0
    let securityScoreSum = 0

    fileReports.forEach(report => {
      totalDiagnostics += report.diagnostics.length
      errorCount += report.diagnostics.filter(d => d.type === 'error').length
      warningCount += report.diagnostics.filter(d => d.type === 'warning').length
      totalComplexity += report.metrics.complexity
      
      // Calculate file security score
      const criticalCount = report.security.filter(s => s.severity === 'critical').length
      const highCount = report.security.filter(s => s.severity === 'high').length
      securityScoreSum += Math.max(0, 100 - (criticalCount * 25 + highCount * 10))
    })

    return {
      totalFiles: fileReports.length,
      totalDiagnostics,
      errorCount,
      warningCount,
      securityScore: fileReports.length > 0 ? Math.floor(securityScoreSum / fileReports.length) : 100,
      averageComplexity: fileReports.length > 0 ? totalComplexity / fileReports.length : 0
    }
  }
}
