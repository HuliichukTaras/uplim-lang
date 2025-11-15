#!/usr/bin/env node

import { Command } from 'commander'
import { UPLimEngine } from './engine'
import * as path from 'path'

const program = new Command()

program
  .name('uplim-engine')
  .description('UPLim Language Analysis Engine')
  .version('0.1.0')

program
  .command('analyze')
  .description('Analyze UPLim project or file')
  .argument('[path]', 'Path to analyze', '.')
  .option('--ai', 'Enable AI-powered suggestions')
  .action(async (targetPath: string, options: { ai?: boolean }) => {
    try {
      const absolutePath = path.resolve(targetPath)
      const projectRoot = process.cwd()
      
      console.log('='.repeat(60))
      console.log('UPLim Engine - Analysis Report')
      console.log('='.repeat(60))
      console.log('')

      const engine = new UPLimEngine(projectRoot)
      const report = await engine.analyze(absolutePath, options)

      console.log('')
      console.log('='.repeat(60))
      console.log('SUMMARY')
      console.log('='.repeat(60))
      console.log(`Files analyzed:     ${report.summary.totalFiles}`)
      console.log(`Total diagnostics:  ${report.summary.totalDiagnostics}`)
      console.log(`  - Errors:         ${report.summary.errorCount}`)
      console.log(`  - Warnings:       ${report.summary.warningCount}`)
      console.log(`Security score:     ${report.summary.securityScore}/100`)
      console.log(`Avg complexity:     ${report.summary.averageComplexity.toFixed(1)}`)
      console.log('')

      // Show diagnostics
      if (report.summary.totalDiagnostics > 0) {
        console.log('DIAGNOSTICS:')
        report.files.forEach(file => {
          if (file.diagnostics.length > 0) {
            console.log(`\n  ${file.path}:`)
            file.diagnostics.forEach(d => {
              const icon = d.type === 'error' ? '✗' : d.type === 'warning' ? '⚠' : 'ℹ'
              console.log(`    ${icon} Line ${d.line}: ${d.message} [${d.rule}]`)
            })
          }
        })
        console.log('')
      }

      // Show security issues
      const allSecurityIssues = report.files.flatMap(f => f.security)
      if (allSecurityIssues.length > 0) {
        console.log('SECURITY ISSUES:')
        allSecurityIssues.forEach(issue => {
          console.log(`  [${issue.severity.toUpperCase()}] ${issue.message}`)
          console.log(`    File: ${issue.file}:${issue.line}`)
          console.log(`    Fix: ${issue.recommendation}`)
          console.log('')
        })
      }

      // Show AI analysis if available
      if (report.aiAnalysis) {
        console.log('AI INSIGHTS:')
        report.aiAnalysis.suggestions.forEach(s => console.log(`  • ${s}`))
        console.log('')
      }

      console.log('='.repeat(60))
      console.log(`Report saved to .uplim/reports/`)
      console.log('='.repeat(60))

      process.exit(report.summary.errorCount > 0 ? 1 : 0)
    } catch (error) {
      console.error('Engine error:', error)
      process.exit(1)
    }
  })

program.parse()
