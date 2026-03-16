import * as fs from 'fs'
import * as path from 'path'
import * as http from 'http'

import { Parser } from 'uplim-frontend'
import { Compiler } from 'uplim-compiler-js'

import { UPLimEngine } from './engine'
import { loadManifestFile, type UplimManifest } from './manifest'

export interface UplimProject {
  rootDir: string
  manifestPath: string
  manifest: UplimManifest
}

export interface ProjectPageArtifact {
  route: string
  kind: 'entry' | 'page'
  sourcePath: string
  outputPath: string
  html: string
}

export interface ProjectRouteArtifact {
  route: string
  sourcePath: string
  outputPath: string
  body: string
}

export interface ProjectBuildArtifact {
  project: UplimProject
  outputDir: string
  compiledEntryPath: string
  serverPath: string
  metadataPath: string
  pages: ProjectPageArtifact[]
  routes: ProjectRouteArtifact[]
  copiedAssets: string[]
}

export interface ProjectServerHandle {
  artifact: ProjectBuildArtifact
  port: number
  host: string
  server: http.Server
  close(): Promise<void>
}

interface ExecutedSource {
  sourcePath: string
  output: string[]
}

interface RenderSection {
  kind: 'layout' | 'page' | 'entry'
  sourcePath: string
  output: string[]
}

const TEXT_ENCODINGS = 'utf-8'

function ensureDirectory(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true })
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function detectProjectRoot(target: string): string {
  const resolved = path.resolve(target)
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    return resolved
  }

  if (path.basename(resolved) === 'uplim.toml') {
    return path.dirname(resolved)
  }

  return path.dirname(resolved)
}

function copyDirectory(sourceDir: string, targetDir: string, copiedAssets: string[], rootDir: string): void {
  if (!fs.existsSync(sourceDir)) {
    return
  }

  ensureDirectory(targetDir)
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath, copiedAssets, rootDir)
      continue
    }

    fs.copyFileSync(sourcePath, targetPath)
    copiedAssets.push(path.relative(rootDir, sourcePath))
  }
}

function walkFiles(rootDir: string, predicate: (filePath: string) => boolean): string[] {
  if (!fs.existsSync(rootDir)) {
    return []
  }

  const files: string[] = []

  const visit = (currentDir: string): void => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue
      }

      const entryPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        visit(entryPath)
        continue
      }

      if (predicate(entryPath)) {
        files.push(entryPath)
      }
    }
  }

  visit(rootDir)
  return files.sort()
}

function executeUplSource(projectRoot: string, sourcePath: string): ExecutedSource {
  const source = fs.readFileSync(sourcePath, TEXT_ENCODINGS)
  const engine = new UPLimEngine(projectRoot)
  const originalLog = console.log
  let result
  console.log = () => {}
  try {
    result = engine.execute(source)
  } finally {
    console.log = originalLog
  }
  if (!result.ok) {
    throw new Error(`Failed to execute ${sourcePath}: ${result.error.message}`)
  }

  return {
    sourcePath,
    output: result.output,
  }
}

function renderOutputLines(output: string[]): string {
  if (output.length === 0) {
    return '<pre class="uplim-output uplim-output--empty">(no output)</pre>'
  }

  return `<pre class="uplim-output">${escapeHtml(output.join('\n'))}</pre>`
}

function renderHtmlDocument(title: string, route: string, sections: RenderSection[]): string {
  const body = sections
    .map(section => {
      const heading = section.kind[0].toUpperCase() + section.kind.slice(1)
      return [
        `<section class="uplim-section uplim-section--${section.kind}" data-source="${escapeHtml(section.sourcePath)}">`,
        `<header><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(section.sourcePath)}</p></header>`,
        renderOutputLines(section.output),
        '</section>',
      ].join('\n')
    })
    .join('\n')

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  <title>${escapeHtml(title)}</title>`,
    '  <style>',
    '    :root { color-scheme: light; }',
    '    body { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #0f172a; color: #e2e8f0; margin: 0; padding: 2rem; }',
    '    main { max-width: 960px; margin: 0 auto; display: grid; gap: 1rem; }',
    '    .uplim-shell { border: 1px solid #334155; border-radius: 16px; background: linear-gradient(180deg, #111827, #0f172a); overflow: hidden; }',
    '    .uplim-shell header { padding: 1rem 1.25rem; border-bottom: 1px solid #334155; background: rgba(15, 23, 42, 0.8); }',
    '    .uplim-shell h1, .uplim-shell h2, .uplim-shell p { margin: 0; }',
    '    .uplim-shell h1 { font-size: 1.1rem; }',
    '    .uplim-shell p { margin-top: 0.4rem; color: #94a3b8; }',
    '    .uplim-section { padding: 1rem 1.25rem; border-top: 1px solid #1e293b; }',
    '    .uplim-output { white-space: pre-wrap; margin: 0.75rem 0 0; padding: 1rem; border-radius: 12px; background: #020617; color: #7dd3fc; }',
    '    .uplim-output--empty { color: #94a3b8; }',
    '  </style>',
    '</head>',
    '<body>',
    '  <main>',
    '    <article class="uplim-shell">',
    `      <header><h1>${escapeHtml(title)}</h1><p>Route: ${escapeHtml(route)}</p></header>`,
    body,
    '    </article>',
    '  </main>',
    '</body>',
    '</html>',
  ].join('\n')
}

function relativeRouteFromPage(appRoot: string, sourcePath: string): string {
  const relativeDir = path.relative(appRoot, path.dirname(sourcePath))
  if (!relativeDir || relativeDir === '.') {
    return '/'
  }

  return `/${relativeDir.split(path.sep).join('/')}`
}

function relativeRouteFromRouteFile(appRoot: string, sourcePath: string): string {
  const relativeDir = path.relative(appRoot, path.dirname(sourcePath))
  const normalized = relativeDir.split(path.sep).join('/')
  const routePath = normalized
    .replace(/^routes\/?/, '')
    .replace(/^api\/?/, 'api/')
    .replace(/\/$/, '')

  return routePath ? `/${routePath}` : '/'
}

function htmlOutputPath(outputDir: string, route: string): string {
  if (route === '/') {
    return path.join(outputDir, 'index.html')
  }

  return path.join(outputDir, route.slice(1), 'index.html')
}

function textOutputPath(outputDir: string, route: string): string {
  if (route === '/') {
    return path.join(outputDir, 'route.txt')
  }

  return path.join(outputDir, route.slice(1), 'route.txt')
}

function buildLayoutChain(projectRoot: string, appRoot: string, pagePath: string): RenderSection[] {
  const sections: RenderSection[] = []
  let currentDir = path.dirname(pagePath)

  while (currentDir.startsWith(appRoot)) {
    const layoutPath = path.join(currentDir, 'layout.upl')
    if (fs.existsSync(layoutPath)) {
      const executed = executeUplSource(projectRoot, layoutPath)
      sections.unshift({
        kind: 'layout',
        sourcePath: path.relative(projectRoot, executed.sourcePath),
        output: executed.output,
      })
    }

    if (currentDir === appRoot) {
      break
    }

    currentDir = path.dirname(currentDir)
  }

  return sections
}

function compileEntry(project: UplimProject, outputDir: string): string {
  const parser = new Parser()
  const compiler = new Compiler()
  const entryPath = path.join(project.rootDir, project.manifest.build.entry)
  const source = fs.readFileSync(entryPath, TEXT_ENCODINGS)
  const result = parser.parse(source, entryPath)

  if (result.errors.length > 0) {
    const first = result.errors[0]
    throw new Error(`Cannot compile entry ${project.manifest.build.entry}: ${first.message} at ${first.line}:${first.column}`)
  }

  const compiled = compiler.compile(result.ast)
  const outputPath = path.join(outputDir, 'main.js')
  fs.writeFileSync(outputPath, `${compiled}\n`, TEXT_ENCODINGS)
  return outputPath
}

function generateServerSource(artifact: ProjectBuildArtifact): string {
  const pages = Object.fromEntries(artifact.pages.map(page => [page.route, path.relative(artifact.outputDir, page.outputPath).split(path.sep).join('/')]))
  const routes = Object.fromEntries(artifact.routes.map(route => [route.route, route.body]))

  return [
    "const fs = require('node:fs')",
    "const path = require('node:path')",
    "const http = require('node:http')",
    '',
    `const OUTPUT_DIR = __dirname`,
    `const HTML_ROUTES = ${JSON.stringify(pages, null, 2)}`,
    `const TEXT_ROUTES = ${JSON.stringify(routes, null, 2)}`,
    '',
    'function contentType(filePath) {',
    "  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8'",
    "  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8'",
    "  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8'",
    "  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8'",
    "  if (filePath.endsWith('.svg')) return 'image/svg+xml'",
    "  if (filePath.endsWith('.png')) return 'image/png'",
    "  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg'",
    "  return 'text/plain; charset=utf-8'",
    '}',
    '',
    'function serveFile(res, filePath) {',
    '  const body = fs.readFileSync(filePath)',
    "  res.writeHead(200, { 'Content-Type': contentType(filePath) })",
    '  res.end(body)',
    '}',
    '',
    'function createServer() {',
    '  return http.createServer((req, res) => {',
    "    const url = new URL(req.url || '/', 'http://localhost')",
    "    const route = url.pathname.replace(/\\/$/, '') || '/'",
    '',
    '    if (Object.prototype.hasOwnProperty.call(TEXT_ROUTES, route)) {',
    "      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })",
    '      res.end(TEXT_ROUTES[route])',
    '      return',
    '    }',
    '',
    "    const staticCandidate = path.join(OUTPUT_DIR, route === '/' ? 'index.html' : route.slice(1))",
    '    if (fs.existsSync(staticCandidate) && fs.statSync(staticCandidate).isFile()) {',
    '      serveFile(res, staticCandidate)',
    '      return',
    '    }',
    '',
    '    if (Object.prototype.hasOwnProperty.call(HTML_ROUTES, route)) {',
    '      serveFile(res, path.join(OUTPUT_DIR, HTML_ROUTES[route]))',
    '      return',
    '    }',
    '',
    "    const fallback = path.join(OUTPUT_DIR, 'index.html')",
    '    if (fs.existsSync(fallback)) {',
    '      serveFile(res, fallback)',
    '      return',
    '    }',
    '',
    "    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })",
    "    res.end('Not found')",
    '  })',
    '}',
    '',
    'if (require.main === module) {',
    '  const host = process.env.HOST || "127.0.0.1"',
    '  const port = Number(process.env.PORT || "3000")',
    '  const server = createServer()',
    '  server.listen(port, host, () => {',
    '    console.log(`UPLim server listening on http://${host}:${port}`)',
    '  })',
    '}',
    '',
    'module.exports = { createServer }',
    '',
  ].join('\n')
}

function writeBuildMetadata(artifact: ProjectBuildArtifact): string {
  const metadataPath = path.join(artifact.outputDir, 'build.json')
  const metadata = {
    package: artifact.project.manifest.package,
    build: artifact.project.manifest.build,
    outputDir: artifact.outputDir,
    compiledEntryPath: artifact.compiledEntryPath,
    pages: artifact.pages.map(page => ({
      route: page.route,
      kind: page.kind,
      sourcePath: page.sourcePath,
      outputPath: page.outputPath,
    })),
    routes: artifact.routes.map(route => ({
      route: route.route,
      sourcePath: route.sourcePath,
      outputPath: route.outputPath,
    })),
    copiedAssets: artifact.copiedAssets,
  }

  fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, TEXT_ENCODINGS)
  return metadataPath
}

export function loadProject(target = '.'): UplimProject {
  const rootDir = detectProjectRoot(target)
  const manifestPath = path.join(rootDir, 'uplim.toml')
  const result = loadManifestFile(manifestPath)

  if (result.diagnostics.length > 0 || !result.manifest) {
    const details = result.diagnostics.map(diag => diag.message).join('; ')
    throw new Error(details || `Unable to load manifest at ${manifestPath}`)
  }

  return {
    rootDir,
    manifestPath,
    manifest: result.manifest,
  }
}

export function renderProject(target = '.'): ProjectBuildArtifact {
  const project = loadProject(target)
  const outputDir = path.resolve(project.rootDir, project.manifest.build.output)
  ensureDirectory(outputDir)

  const compiledEntryPath = compileEntry(project, outputDir)
  const appRoot = path.resolve(project.rootDir, project.manifest.build.app_root ?? 'app')
  const pageFiles = walkFiles(appRoot, filePath => path.basename(filePath) === 'page.upl')
  const routeFiles = walkFiles(appRoot, filePath => path.basename(filePath) === 'route.upl')

  const pages: ProjectPageArtifact[] = []
  const routes: ProjectRouteArtifact[] = []

  const entryPath = path.join(project.rootDir, project.manifest.build.entry)
  const entryExecution = executeUplSource(project.rootDir, entryPath)
  const entryHtml = renderHtmlDocument(
    `${project.manifest.package.name} bootstrap`,
    '/__entry__',
    [{
      kind: 'entry',
      sourcePath: path.relative(project.rootDir, entryExecution.sourcePath),
      output: entryExecution.output,
    }],
  )
  const entryOutputPath = path.join(outputDir, '__entry__.html')
  fs.writeFileSync(entryOutputPath, entryHtml, TEXT_ENCODINGS)
  pages.push({
    route: '/__entry__',
    kind: 'entry',
    sourcePath: entryPath,
    outputPath: entryOutputPath,
    html: entryHtml,
  })

  for (const pagePath of pageFiles) {
    const route = relativeRouteFromPage(appRoot, pagePath)
    const layoutSections = buildLayoutChain(project.rootDir, appRoot, pagePath)
    const pageExecution = executeUplSource(project.rootDir, pagePath)
    const sections: RenderSection[] = [
      ...layoutSections,
      {
        kind: 'page',
        sourcePath: path.relative(project.rootDir, pageExecution.sourcePath),
        output: pageExecution.output,
      },
    ]
    const html = renderHtmlDocument(`${project.manifest.package.name} ${route}`, route, sections)
    const outputPath = htmlOutputPath(outputDir, route)
    ensureDirectory(path.dirname(outputPath))
    fs.writeFileSync(outputPath, html, TEXT_ENCODINGS)
    pages.push({
      route,
      kind: 'page',
      sourcePath: pagePath,
      outputPath,
      html,
    })
  }

  for (const routePath of routeFiles) {
    const route = relativeRouteFromRouteFile(appRoot, routePath)
    const execution = executeUplSource(project.rootDir, routePath)
    const body = execution.output.join('\n')
    const outputPath = textOutputPath(outputDir, route)
    ensureDirectory(path.dirname(outputPath))
    fs.writeFileSync(outputPath, body, TEXT_ENCODINGS)
    routes.push({
      route,
      sourcePath: routePath,
      outputPath,
      body,
    })
  }

  const copiedAssets: string[] = []
  copyDirectory(path.join(project.rootDir, 'public'), path.join(outputDir, 'public'), copiedAssets, project.rootDir)

  const artifact: ProjectBuildArtifact = {
    project,
    outputDir,
    compiledEntryPath,
    serverPath: path.join(outputDir, 'server.js'),
    metadataPath: '',
    pages,
    routes,
    copiedAssets,
  }

  fs.writeFileSync(artifact.serverPath, generateServerSource(artifact), TEXT_ENCODINGS)
  artifact.metadataPath = writeBuildMetadata(artifact)
  return artifact
}

export function buildProject(target = '.'): ProjectBuildArtifact {
  return renderProject(target)
}

export async function serveProject(target = '.', options: { port?: number; host?: string } = {}): Promise<ProjectServerHandle> {
  const artifact = buildProject(target)
  const pageMap = new Map<string, string>(artifact.pages.filter(page => page.kind === 'page').map(page => [page.route, page.outputPath]))
  const routeMap = new Map<string, string>(artifact.routes.map(route => [route.route, route.body]))
  const host = options.host ?? '127.0.0.1'

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const route = url.pathname.replace(/\/$/, '') || '/'

    if (routeMap.has(route)) {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end(routeMap.get(route))
      return
    }

    const filePath = pageMap.get(route) ?? pageMap.get('/') ?? path.join(artifact.outputDir, 'index.html')
    const body = fs.readFileSync(filePath)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(body)
  })

  const port = options.port ?? 3000
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => resolve())
  })

  const address = server.address()
  const resolvedPort = typeof address === 'object' && address ? address.port : port

  return {
    artifact,
    port: resolvedPort,
    host,
    server,
    close: () => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
    }),
  }
}
