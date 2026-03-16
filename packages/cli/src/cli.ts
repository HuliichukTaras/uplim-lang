#!/usr/bin/env node

import { Parser, formatSource, typeCheckProgram } from 'uplim-frontend'
import { Compiler } from 'uplim-compiler-js'
import {
  UPLimEngine,
  loadManifestFile,
  formatManifestDiagnostics,
  buildProject,
  renderProject,
  serveProject,
} from 'uplim-tooling'
import * as fs from 'fs'
import * as path from 'path'
type CommandName = 'analyze' | 'run' | 'compile' | 'build' | 'render' | 'serve' | 'ai' | 'check' | 'fmt' | 'manifest' | 'init'

function printUsage() {
  console.log(`UPLim CLI

Usage:
  uplim analyze [path] [--ai]
  uplim run <file>
  uplim compile <file> [-o output] [--stdout]
  uplim build [path]
  uplim render [path] [--stdout] [--route /path]
  uplim serve [path] [--port 3000] [--host 127.0.0.1]
  uplim ai <prompt> [-m model]
  uplim check <file>
  uplim manifest [path]
  uplim init [path]
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

function buildCommand(args: string[]) {
  const target = args.find(arg => !arg.startsWith('-')) ?? '.'
  const artifact = buildProject(target)

  console.log(`✓ Project built`)
  console.log(`  root:     ${artifact.project.rootDir}`)
  console.log(`  output:   ${artifact.outputDir}`)
  console.log(`  entry JS: ${artifact.compiledEntryPath}`)
  console.log(`  server:   ${artifact.serverPath}`)
  console.log(`  pages:    ${artifact.pages.filter(page => page.kind === 'page').length}`)
  console.log(`  routes:   ${artifact.routes.length}`)
}

function renderCommand(args: string[]) {
  const target = args.find(arg => !arg.startsWith('-')) ?? '.'
  const stdout = args.includes('--stdout')
  const routeFlagIndex = args.findIndex(arg => arg === '--route')
  const routeFilter = routeFlagIndex >= 0 ? args[routeFlagIndex + 1] : undefined
  const artifact = renderProject(target)
  const pages = artifact.pages.filter(page => page.kind === 'page')
  const selectedPage = routeFilter
    ? pages.find(page => page.route === routeFilter)
    : pages[0]

  if (stdout && selectedPage) {
    console.log(selectedPage.html)
    return
  }

  console.log(`✓ Render complete`)
  for (const page of pages) {
    console.log(`  html  ${page.route} -> ${page.outputPath}`)
  }
  for (const route of artifact.routes) {
    console.log(`  route ${route.route} -> ${route.outputPath}`)
  }
}

async function serveCommand(args: string[]) {
  const target = args.find(arg => !arg.startsWith('-')) ?? '.'
  const portFlagIndex = args.findIndex(arg => arg === '--port')
  const hostFlagIndex = args.findIndex(arg => arg === '--host')
  const port = portFlagIndex >= 0 ? Number(args[portFlagIndex + 1]) : undefined
  const host = hostFlagIndex >= 0 ? args[hostFlagIndex + 1] : undefined
  const serverHandle = await serveProject(target, { port, host })

  console.log(`UPLim dev server running at http://${serverHandle.host}:${serverHandle.port}`)
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

  const typeCheckResult = typeCheckProgram(result.ast)
  if (typeCheckResult.diagnostics.length > 0) {
    console.error(`Check failed: ${typeCheckResult.diagnostics.length} semantic error(s) found`)
    typeCheckResult.diagnostics.forEach(diagnostic => {
      console.error(`  ✗ ${file}:${diagnostic.location.line}:${diagnostic.location.column} ${diagnostic.code} - ${diagnostic.message}`)
    })
    process.exit(1)
  }

  console.log(`✓ ${file} syntax and semantics valid`)
}

function fmtCommand(args: string[]) {
  const file = args[0]
  if (!file) {
    throw new Error('Missing file path for `fmt`.')
  }

  const write = args.includes('-w') || args.includes('--write')
  const filePath = requireFile(file)
  const content = fs.readFileSync(filePath, 'utf-8')
  const result = formatSource(content, filePath)

  if (result.errors.length > 0) {
    console.error(`Format failed: ${result.errors.length} parse error(s) found`)
    result.errors.forEach(err => {
      console.error(`  ✗ ${file}:${err.line}:${err.column} - ${err.message}`)
    })
    process.exit(1)
  }

  if (write) {
    fs.writeFileSync(filePath, result.formatted)
    console.log(`✓ Formatted ${file}`)
    return
  }

  process.stdout.write(result.formatted)
}

function initCommand(args: string[]) {
  const target = args[0] ?? '.'
  const root = path.resolve(process.cwd(), target)
  fs.mkdirSync(root, { recursive: true })

  const directories = [
    '.uplim',
    'src',
    'modules',
    'schemas',
    'services',
    'ai',
    'wasm',
    'tests',
  ]

  for (const directory of directories) {
    fs.mkdirSync(path.join(root, directory), { recursive: true })
  }

  const packageName = path.basename(root).toLowerCase().replace(/[^a-z0-9-_]/g, '-')
  const files = new Map<string, string>([
    ['uplim.toml', [
      '[package]',
      `name = "${packageName || 'uplim-app'}"`,
      'version = "0.1.0"',
      '',
      '[build]',
      'entry = "src/main.upl"',
      'profile = "wasm-component"',
      '',
      '[capabilities]',
      'filesystem = false',
      'network_client = false',
      'http_server = false',
      'structured_logging = true',
      'ai_local = false',
      'ai_remote = false',
      'ai_tool_call = false',
      'mcp_client = false',
      'allow_tool_calls = false',
      'allow_mcp = false',
      '',
      '[features]',
      'state_model = true',
      'readable_syntax = true',
    ].join('\n')],
    ['src/main.upl', [
      'state AppState {',
      '  message: String',
      '  visits: Int',
      '}',
      '',
      'fn reducer(current: AppState) -> AppState {',
      '  return current with { visits: current.visits + 1 }',
      '}',
      '',
      'let app = AppState { message: "Hello UPLim", visits: 0 }',
      'let next = reducer(app)',
      'say next.message',
      'say next.visits',
    ].join('\n')],
    ['README.md', [
      `# ${packageName || 'uplim-app'}`,
      '',
      'Generated by `uplim init`.',
      '',
      '## Commands',
      '',
      '- `uplim check src/main.upl`',
      '- `uplim fmt src/main.upl -w`',
      '- `uplim run src/main.upl`',
    ].join('\n')],
  ])

  for (const [relativePath, content] of files) {
    const fullPath = path.join(root, relativePath)
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, `${content}\n`)
    }
  }

  console.log(`✓ Initialized UPLim project at ${root}`)
}

function manifestCommand(args: string[]) {
  const target = args[0] ?? '.'
  const result = loadManifestFile(target)

  if (result.diagnostics.length > 0) {
    console.error('Manifest validation failed:')
    for (const line of formatManifestDiagnostics(result.diagnostics)) {
      console.error(`  ${line}`)
    }
    process.exit(1)
  }

  if (!result.manifest) {
    console.error('Manifest validation failed with unknown error.')
    process.exit(1)
  }

  console.log('✓ Manifest valid')
  console.log(`  package: ${result.manifest.package.name}@${result.manifest.package.version}`)
  console.log(`  entry:   ${result.manifest.build.entry}`)
  console.log(`  profile: ${result.manifest.build.profile}`)

  const enabledCapabilities = Object.entries(result.manifest.capabilities)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key)

  console.log(`  capabilities: ${enabledCapabilities.length > 0 ? enabledCapabilities.join(', ') : '(none)'}`)
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
      case 'build':
        buildCommand(args)
        return
      case 'render':
        renderCommand(args)
        return
      case 'serve':
        await serveCommand(args)
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
      case 'init':
        initCommand(args)
        return
      case 'manifest':
        manifestCommand(args)
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
