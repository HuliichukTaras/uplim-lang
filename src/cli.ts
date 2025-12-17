#!/usr/bin/env node

import { Command } from 'commander'
import { UPLimEngine } from './engine'
import { UPLimParser } from './parser'
import * as fs from 'fs'
import * as path from 'path'
import { Compiler } from './compiler'
import { isLeft } from 'fp-ts/Either'

const program = new Command()

program
  .name('uplim-engine')
  .description('UPLim Language Analysis Engine')
  .version('0.1.0')

program
  .command('check')
  .alias('analyze')
  .description('Check UPLim project for errors (Static Analysis)')
  .argument('[path]', 'Path to check', '.')
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

program
  .command('init')
  .description('Initialize a new UPLim project')
  .argument('[name]', 'Project name')
  .action((name) => {
      const projectName = name || 'uplim-project'
      const targetDir = path.resolve(process.cwd(), projectName)
      
      if (fs.existsSync(targetDir)) {
          console.error(`Directory ${projectName} already exists`)
          process.exit(1)
      }
      
      fs.mkdirSync(targetDir)
      
      const mainContent = `# My UPLim Project
say "Hello from UPLim!"

fn main() {
    let x = 10
    say "X is " + x
}

main()
`
      fs.writeFileSync(path.join(targetDir, 'main.upl'), mainContent)
      console.log(`Initialized new project in ${projectName}`)
  })

program
  .command('fmt')
  .description('Format UPLim source code')
  .argument('[file]', 'File to format')
  .action((file) => {
      console.log("Formatter coming in v0.2. (Phase 1.3 of Roadmap)")
  })

program
  .command('run')
  .description('Run a UPLim file')
  .argument('<file>', 'File to run')
  .action(async (filePath: string) => {
    try {
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`)
        process.exit(1)
      }

      const source = fs.readFileSync(filePath, 'utf-8')
      const engine = new UPLimEngine(process.cwd()) // Added required projectRoot argument
      const result = engine.execute(source)

      if (isLeft(result)) {
        console.error(result.left.message)
        process.exit(1)
      }
      
      // Print output from execution
      result.right.forEach(line => console.log(line))
      
    } catch (error: any) {
      console.error(error.message)
      process.exit(1)
    }
  })

program
  .command('compile <file>')
  .description('Compile a .upl file to JavaScript')
  .option('-o, --output <output>', 'Output JavaScript file')
  .option('--stdout', 'Print compiled code to stdout')
  .action((file, options) => {
    const filePath = path.resolve(process.cwd(), file)
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${file}`)
      process.exit(1)
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    const parser = new UPLimParser()
    const result = parser.parse(content, filePath)
    
    if (result.errors.length > 0) {
      console.error('Compilation failed with errors:')
      result.errors.forEach(err => console.error(err))
      process.exit(1)
    }

    const compiler = new Compiler()
    const jsCode = compiler.compile(result.ast)
    
    if (options.stdout) {
      console.log(jsCode)
    } else {
      const outputPath = options.output || file.replace(/\.upl$/, '.js')
      fs.writeFileSync(outputPath, jsCode)
      console.log(`Compiled to ${outputPath}`)
    }
  })

program
  .command('ai <prompt>')
  .description('Ask local AI (Ollama) for help with UPLim code')
  .option('-m, --model <model>', 'Ollama model to use', 'codellama:13b')
  .action(async (prompt, options) => {
    const model = options.model
    const url = 'http://localhost:11434/api/generate'
    
    console.log(`🤖 Asking ${model}: "${prompt}"...`)
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: model,
          prompt: `You are an expert UPLim programmer. ${prompt}`,
          stream: false
        })
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`)
      }

      const data = await response.json() as any
      console.log('\nResult:\n')
      console.log(data.response)
      
    } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
            console.error('Error: Could not connect to Ollama. Is it running at http://localhost:11434?')
        } else {
            console.error('Error talking to AI:', error.message)
        }
    }
  })

program.parse(process.argv)
