#!/usr/bin/env node

import { Parser } from 'uplim-frontend'
import { Compiler } from 'uplim-compiler-js'
import { UPLimEngine } from 'uplim-tooling'
import * as fs from 'fs'
import * as path from 'path'
type CommandName = 'analyze' | 'run' | 'compile' | 'ai' | 'check' | 'fmt'

function printUsage() {
  console.log(`UPLim CLI

Usage:
  uplim analyze [path] [--ai]
  uplim run <file>
  uplim compile <file> [-o output] [--stdout]
  uplim ai <prompt> [-m model]
  uplim check <file>
  uplim fmt <file> [-w]
`)
}

function requireFile(file: string): string {
  const filePath = path.resolve(process.cwd(), file)
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${file}`)
  }
  return filePath
}

async function analyzeCommand(args: string[]) {
  const ai = args.includes('--ai')
  const targetPath = args.find(arg => !arg.startsWith('-')) ?? '.'
  const absolutePath = path.resolve(targetPath)
  const projectRoot = process.cwd()

  console.log('='.repeat(60))
  console.log('UPLim Engine - Analysis Report')
  console.log('='.repeat(60))
  console.log('')

  const engine = new UPLimEngine(projectRoot)
  const report = await engine.analyze(absolutePath, { ai })

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

  const allSecurityIssues = report.files.flatMap(file => file.security)
  if (allSecurityIssues.length > 0) {
    console.log('SECURITY ISSUES:')
    allSecurityIssues.forEach(issue => {
      console.log(`  [${issue.severity.toUpperCase()}] ${issue.message}`)
      console.log(`    File: ${issue.file}:${issue.line}`)
      console.log(`    Fix: ${issue.recommendation}`)
      console.log('')
    })
  }

  if (report.aiAnalysis) {
    console.log('AI INSIGHTS:')
    report.aiAnalysis.suggestions.forEach(suggestion => console.log(`  • ${suggestion}`))
    console.log('')
  }

  console.log('='.repeat(60))
  console.log('Report saved to .uplim/reports/')
  console.log('='.repeat(60))

  process.exit(report.summary.errorCount > 0 ? 1 : 0)
}

function runCommand(args: string[]) {
  const file = args[0]
  if (!file) {
    throw new Error('Missing file path for `run`.')
  }

  const filePath = requireFile(file)
  const source = fs.readFileSync(filePath, 'utf-8')
  const engine = new UPLimEngine(process.cwd())
  const result = engine.execute(source)

  if (!result.ok) {
    throw result.error
  }
}

function compileCommand(args: string[]) {
  const file = args.find(arg => !arg.startsWith('-'))
  if (!file) {
    throw new Error('Missing file path for `compile`.')
  }

  const stdout = args.includes('--stdout')
  const outputFlagIndex = args.findIndex(arg => arg === '-o' || arg === '--output')
  const outputPath = outputFlagIndex >= 0 ? args[outputFlagIndex + 1] : undefined
  const filePath = requireFile(file)
  const content = fs.readFileSync(filePath, 'utf-8')
  const parser = new Parser()
  const result = parser.parse(content, filePath)

  if (result.errors.length > 0) {
    console.error('Compilation failed with errors:')
    result.errors.forEach(err => console.error(err))
    process.exit(1)
  }

  const compiler = new Compiler()
  const jsCode = compiler.compile(result.ast)

  if (stdout) {
    console.log(jsCode)
    return
  }

  const finalOutputPath = outputPath || file.replace(/\.upl$/, '.js')
  fs.writeFileSync(finalOutputPath, jsCode)
  console.log(`Compiled to ${finalOutputPath}`)
}

async function aiCommand(args: string[]) {
  const modelFlagIndex = args.findIndex(arg => arg === '-m' || arg === '--model')
  const model = modelFlagIndex >= 0 ? args[modelFlagIndex + 1] : 'codellama:13b'
  const promptParts = args.filter((arg, index) => {
    if (index === modelFlagIndex || index === modelFlagIndex + 1) {
      return false
    }
    return true
  })
  const prompt = promptParts.join(' ').trim()

  if (!prompt) {
    throw new Error('Missing prompt for `ai`.')
  }

  const url = 'http://localhost:11434/api/generate'
  console.log(`Asking ${model}: "${prompt}"...`)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt: `You are an expert UPLim programmer. ${prompt}`,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const data = await response.json() as { response: string }
    console.log('\nResult:\n')
    console.log(data.response)
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.error('Error: Could not connect to Ollama. Is it running at http://localhost:11434?')
      return
    }
    throw error
  }
}

function checkCommand(args: string[]) {
  const file = args[0]
  if (!file) {
    throw new Error('Missing file path for `check`.')
  }

  const filePath = requireFile(file)
  const content = fs.readFileSync(filePath, 'utf-8')
  const parser = new Parser()
  const result = parser.parse(content, filePath)

  if (result.errors.length > 0) {
    console.error(`Check failed: ${result.errors.length} error(s) found`)
    result.errors.forEach(err => {
      console.error(`  ${err.severity === 'error' ? '✗' : '⚠'} ${file}:${err.line}:${err.column} - ${err.message}`)
    })
    process.exit(1)
  }

  console.log(`✓ ${file} syntax valid`)
}

function fmtCommand(args: string[]) {
  const file = args[0]
  if (!file) {
    throw new Error('Missing file path for `fmt`.')
  }

  console.log(`Formatting ${file}... (Placeholder: implementation coming in v0.2)`)
}

async function main() {
  const [, , rawCommand, ...args] = process.argv

  if (!rawCommand || rawCommand === '-h' || rawCommand === '--help') {
    printUsage()
    return
  }

  if (rawCommand === '-v' || rawCommand === '--version') {
    console.log('0.1.0')
    return
  }

  const command = rawCommand as CommandName

  try {
    switch (command) {
      case 'analyze':
        await analyzeCommand(args)
        return
      case 'run':
        runCommand(args)
        return
      case 'compile':
        compileCommand(args)
        return
      case 'ai':
        await aiCommand(args)
        return
      case 'check':
        checkCommand(args)
        return
      case 'fmt':
        fmtCommand(args)
        return
      default:
        printUsage()
        process.exit(1)
    }
  } catch (error: any) {
    console.error(error.message)
    process.exit(1)
  }
}

void main()
