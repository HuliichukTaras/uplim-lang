// Security Analysis Module

import { ASTNode } from './parser'

export interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: string
  message: string
  file: string
  line: number
  recommendation: string
}

export interface SecurityReport {
  issues: SecurityIssue[]
  score: number // 0-100
}

export class SecurityAnalyzer {
  analyze(ast: ASTNode, source: string, filename: string): SecurityReport {
    const issues: SecurityIssue[] = []
    const lines = source.split('\n')

    lines.forEach((line, index) => {
      const lineNum = index + 1
      const trimmed = line.trim()

      // Check for unsafe memory operations
      if (trimmed.includes('*mut ') || trimmed.includes('*const ')) {
        issues.push({
          severity: 'high',
          category: 'memory-safety',
          message: 'Raw pointer usage detected',
          file: filename,
          line: lineNum,
          recommendation: 'Use safe references or Box<T> instead of raw pointers'
        })
      }

      // Check for unsafe concurrency
      if (trimmed.includes('unsafe') && (trimmed.includes('thread') || trimmed.includes('spawn'))) {
        issues.push({
          severity: 'critical',
          category: 'concurrency',
          message: 'Unsafe concurrent operation',
          file: filename,
          line: lineNum,
          recommendation: 'Use safe concurrency primitives from std.async'
        })
      }

      // Check for potential injection vulnerabilities
      if (trimmed.includes('exec(') || trimmed.includes('eval(')) {
        issues.push({
          severity: 'critical',
          category: 'injection',
          message: 'Potential code injection risk',
          file: filename,
          line: lineNum,
          recommendation: 'Avoid dynamic code execution'
        })
      }

      // Check for hardcoded secrets
      if (trimmed.match(/password\s*=\s*["']|api_key\s*=\s*["']|secret\s*=\s*["']/i)) {
        issues.push({
          severity: 'high',
          category: 'secrets',
          message: 'Potential hardcoded secret detected',
          file: filename,
          line: lineNum,
          recommendation: 'Use environment variables or secure vault'
        })
      }
    })

    // Calculate security score
    const criticalCount = issues.filter(i => i.severity === 'critical').length
    const highCount = issues.filter(i => i.severity === 'high').length
    const mediumCount = issues.filter(i => i.severity === 'medium').length
    
    const score = Math.max(0, 100 - (criticalCount * 25 + highCount * 10 + mediumCount * 5))

    return { issues, score }
  }
}
