import assert from 'node:assert/strict'
import * as path from 'node:path'

import { serveProject } from 'uplim-engine'

async function main() {
  const fixtureRoot = path.resolve('examples/web_app')
  const handle = await serveProject(fixtureRoot, { port: 0 })

  try {
    const rootResponse = await fetch(`http://${handle.host}:${handle.port}/`)
    assert.equal(rootResponse.status, 200)
    const rootHtml = await rootResponse.text()
    assert.match(rootHtml, /Home Page/)

    const dashboardResponse = await fetch(`http://${handle.host}:${handle.port}/dashboard`)
    assert.equal(dashboardResponse.status, 200)
    const dashboardHtml = await dashboardResponse.text()
    assert.match(dashboardHtml, /Dashboard Page/)

    const healthResponse = await fetch(`http://${handle.host}:${handle.port}/health`)
    assert.equal(healthResponse.status, 200)
    const healthBody = await healthResponse.text()
    assert.equal(healthBody.trim(), 'ok')
  } finally {
    await handle.close()
  }

  console.log('Project serve smoke OK')
}

void main()
