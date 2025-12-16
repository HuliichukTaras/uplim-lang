// Storage Module - persists analysis results

import * as fs from 'fs'
import * as path from 'path'
import { EngineReport } from './engine'

export class Storage {
  private reportsDir: string

  constructor(projectRoot: string) {
    this.reportsDir = path.join(projectRoot, '.uplim', 'reports')
    this.ensureDirectoryExists()
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true })
    }
  }

  saveReport(report: EngineReport): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `report-${timestamp}.json`
    const filepath = path.join(this.reportsDir, filename)

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2))

    // Also save as "latest"
    const latestPath = path.join(this.reportsDir, 'latest.json')
    fs.writeFileSync(latestPath, JSON.stringify(report, null, 2))

    return filepath
  }

  loadLatestReport(): EngineReport | null {
    const latestPath = path.join(this.reportsDir, 'latest.json')
    
    if (!fs.existsSync(latestPath)) {
      return null
    }

    const content = fs.readFileSync(latestPath, 'utf-8')
    return JSON.parse(content)
  }

  getReportHistory(limit: number = 10): EngineReport[] {
    const files = fs.readdirSync(this.reportsDir)
      .filter(f => f.startsWith('report-') && f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, limit)

    return files.map(file => {
      const content = fs.readFileSync(path.join(this.reportsDir, file), 'utf-8')
      return JSON.parse(content)
    })
  }
}
