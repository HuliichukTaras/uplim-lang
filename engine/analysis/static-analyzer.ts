// Engine Module: Static Analysis
// Performs deep code analysis for quality, safety, and performance

import { UPLimCompiler, ASTNode } from '@/lib/uplim-compiler';

export type AnalysisIssue = {
  id: string;
  type: 'error' | 'warning' | 'info' | 'suggestion';
  category: 'safety' | 'performance' | 'style' | 'logic' | 'structure';
  message: string;
  location: { line: number; column: number };
  severity: number; // 1-10
  fix?: string;
};

export class StaticAnalyzer {
  private compiler: UPLimCompiler;

  constructor() {
    this.compiler = new UPLimCompiler('simple');
  }

  analyze(code: string): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    try {
      const tokens = this.compiler.tokenize(code);
      const ast = this.compiler.parse(tokens);

      issues.push(...this.analyzeDeadCode(ast));
      issues.push(...this.analyzeComplexity(ast));
      issues.push(...this.analyzeSafety(code));
      issues.push(...this.analyzePerformance(code));
      issues.push(...this.analyzeStructure(ast));
    } catch (error) {
      issues.push({
        id: 'parse-error',
        type: 'error',
        category: 'logic',
        message: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        location: { line: 0, column: 0 },
        severity: 10,
      });
    }

    return issues;
  }

  private analyzeDeadCode(ast: ASTNode): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];
    
    // Check for unreachable code after return statements
    this.traverseAST(ast, (node, parent) => {
      if (node.type === 'ReturnStatement' && parent?.children) {
        const returnIndex = parent.children.indexOf(node);
        if (returnIndex < parent.children.length - 1) {
          issues.push({
            id: `dead-code-${Date.now()}`,
            type: 'warning',
            category: 'logic',
            message: 'Unreachable code detected after return statement',
            location: { line: 0, column: 0 },
            severity: 6,
            fix: 'Remove code after return statement',
          });
        }
      }
    });

    return issues;
  }

  private analyzeComplexity(ast: ASTNode): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];
    let nestingDepth = 0;
    let maxDepth = 0;

    this.traverseAST(ast, (node) => {
      if (node.type === 'ConditionalStatement' || node.type === 'LoopStatement') {
        nestingDepth++;
        maxDepth = Math.max(maxDepth, nestingDepth);
      }
    });

    if (maxDepth > 3) {
      issues.push({
        id: `complexity-${Date.now()}`,
        type: 'warning',
        category: 'style',
        message: `High nesting depth detected (${maxDepth} levels)`,
        location: { line: 0, column: 0 },
        severity: 5,
        fix: 'Consider refactoring into smaller functions',
      });
    }

    return issues;
  }

  private analyzeSafety(code: string): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Check for unsafe patterns
    const unsafePatterns = [
      { pattern: /\bnull\b/, message: 'Use Option<T> instead of null' },
      { pattern: /\bundefined\b/, message: 'Use Option<T> instead of undefined' },
      { pattern: /\bdelete\b/, message: 'Avoid delete operator, use proper memory management' },
      { pattern: /\beval\b/, message: 'eval is unsafe and should never be used' },
    ];

    unsafePatterns.forEach(({ pattern, message }) => {
      if (pattern.test(code)) {
        issues.push({
          id: `safety-${Date.now()}`,
          type: 'error',
          category: 'safety',
          message,
          location: { line: 0, column: 0 },
          severity: 9,
        });
      }
    });

    return issues;
  }

  private analyzePerformance(code: string): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Check for potential performance issues
    if (code.includes('for') && code.includes('for')) {
      const nestedLoops = (code.match(/for/g) || []).length;
      if (nestedLoops > 2) {
        issues.push({
          id: `perf-${Date.now()}`,
          type: 'warning',
          category: 'performance',
          message: 'Multiple nested loops detected, consider optimization',
          location: { line: 0, column: 0 },
          severity: 4,
        });
      }
    }

    return issues;
  }

  private analyzeStructure(ast: ASTNode): AnalysisIssue[] {
    const issues: AnalysisIssue[] = [];

    // Check for proper program structure
    if (!ast.children || ast.children.length === 0) {
      issues.push({
        id: `structure-${Date.now()}`,
        type: 'warning',
        category: 'structure',
        message: 'Empty program detected',
        location: { line: 0, column: 0 },
        severity: 3,
      });
    }

    return issues;
  }

  private traverseAST(node: ASTNode, callback: (node: ASTNode, parent?: ASTNode) => void, parent?: ASTNode) {
    callback(node, parent);
    node.children?.forEach(child => this.traverseAST(child, callback, node));
  }
}

export const staticAnalyzer = new StaticAnalyzer();
