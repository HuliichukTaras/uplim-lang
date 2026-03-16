import assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'

import { buildProject } from 'uplim-engine'

const fixtureRoot = path.resolve('examples/web_app')
const distDir = path.join(fixtureRoot, 'dist')

fs.rmSync(distDir, { recursive: true, force: true })

const artifact = buildProject(fixtureRoot)

assert.equal(artifact.project.manifest.package.name, 'uplim-web-app')
assert.ok(fs.existsSync(artifact.compiledEntryPath), 'expected compiled entry artifact')
assert.ok(fs.existsSync(path.join(distDir, 'index.html')), 'expected root page html')
assert.ok(fs.existsSync(path.join(distDir, 'dashboard', 'index.html')), 'expected nested page html')
assert.ok(fs.existsSync(path.join(distDir, 'health', 'route.txt')), 'expected route artifact')
assert.ok(fs.existsSync(path.join(distDir, 'server.js')), 'expected generated server')
assert.ok(fs.existsSync(path.join(distDir, 'build.json')), 'expected build metadata')

const rootHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8')
assert.match(rootHtml, /Global Layout/)
assert.match(rootHtml, /Home Page/)

const dashboardHtml = fs.readFileSync(path.join(distDir, 'dashboard', 'index.html'), 'utf-8')
assert.match(dashboardHtml, /Dashboard Layout/)
assert.match(dashboardHtml, /Dashboard Page/)

const healthRoute = fs.readFileSync(path.join(distDir, 'health', 'route.txt'), 'utf-8')
assert.equal(healthRoute.trim(), 'ok')

console.log('Project build smoke OK')
