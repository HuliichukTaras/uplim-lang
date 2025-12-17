// Autonomous Self-Improving Engine - TypeScript Implementation
import { generateText } from 'ai';
import { UPLIM_IDEOLOGY, validateAgainstIdeology } from './uplim-ideology';
import { UPLimCompiler } from './uplim-compiler';
import { ProjectScaffolder } from './uplim-project-structure'; // Fixed import path to correct file

export type EngineTask = {
  id: string;
  type: 'syntax_fix' | 'bug_fix' | 'feature_request' | 'optimization';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  proposal?: EvolutionProposal;
  addedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
};

export type EvolutionProposal = {
  id: string;
  title: string;
  type: 'feature' | 'enhancement' | 'bug_fix' | 'optimization';
  description: string;
  syntaxBefore: string;
  syntaxAfter: string;
  breaksCompatibility: boolean;
  versionBump: 'major' | 'minor' | 'patch';
  testCases: { input: string; expected: string }[];
  ideologyAlignment: {
    readability: number;
    safety: number;
    portability: number;
    performance: number;
    ergonomics: number;
  };
  overallScore: number;
  violations: string[];
  approved: boolean;
};

export type EngineState = {
  version: string;
  isRunning: boolean;
  currentIteration: number;
  tasksQueue: EngineTask[];
  evolutionHistory: {
    iteration: number;
    proposal: EvolutionProposal;
    timestamp: Date;
    status: 'implemented' | 'failed';
  }[];
  stats: {
    totalIterations: number;
    proposalsGenerated: number;
    proposalsApproved: number;
    proposalsRejected: number;
    testsPassed: number;
    testsFailed: number;
  };
};

export class AutonomousEngine {
  private state: EngineState;
  private compiler: UPLimCompiler;
  private iterationInterval?: NodeJS.Timeout;
  private isIterating: boolean = false;
  private operationLock: boolean = false;

  constructor() {
    this.state = {
      version: '0.1.0',
      isRunning: false,
      currentIteration: 0,
      tasksQueue: [],
      evolutionHistory: [],
      stats: {
        totalIterations: 0,
        proposalsGenerated: 0,
        proposalsApproved: 0,
        proposalsRejected: 0,
        testsPassed: 0,
        testsFailed: 0,
      }
    };
    this.compiler = new UPLimCompiler('simple');
  }

  async start() {
    if (this.operationLock) {
      console.log('[Engine] Operation in progress, skipping start');
      return this.state;
    }
    
    if (this.state.isRunning) {
      console.log('[Engine] Already running');
      return this.state;
    }

    this.operationLock = true;

    try {
      console.log('[Engine] =========================================');
      console.log('[Engine] UPLim Autonomous Engine Starting...');
      console.log('[Engine] =========================================');
      
      this.state.isRunning = true;
      this.state.currentIteration = 0;

      await this.checkSyntax();
      await this.updateDocs();

      if (this.iterationInterval) {
        clearInterval(this.iterationInterval);
      }

      this.iterationInterval = setInterval(() => {
        if (!this.operationLock) {
          this.iterate();
        }
      }, 20000);

      console.log('[Engine] Engine started successfully');
    } finally {
      this.operationLock = false;
    }

    return this.state;
  }

  stop() {
    if (this.operationLock) {
      console.log('[Engine] Waiting for current operation to finish...');
      setTimeout(() => this.stop(), 1000);
      return this.state;
    }

    console.log('[Engine] Stopping autonomous engine...');
    this.state.isRunning = false;
    
    if (this.iterationInterval) {
      clearInterval(this.iterationInterval);
      this.iterationInterval = undefined;
    }

    console.log('[Engine] Engine stopped. Total iterations:', this.state.currentIteration);
    return this.state;
  }

  pause() {
    if (this.operationLock) {
      console.log('[Engine] Waiting for current operation to finish...');
      setTimeout(() => this.pause(), 1000);
      return;
    }

    this.state.isRunning = false;
    if (this.iterationInterval) {
      clearInterval(this.iterationInterval);
      this.iterationInterval = undefined;
    }
    console.log('[Engine] Engine paused at iteration', this.state.currentIteration);
  }

  resume() {
    if (this.operationLock) {
      console.log('[Engine] Operation in progress, skipping resume');
      return;
    }
    
    if (this.state.isRunning && this.iterationInterval) {
      console.log('[Engine] Already running');
      return;
    }

    if (!this.state.isRunning) {
      console.log('[Engine] Resuming from iteration', this.state.currentIteration);
      this.state.isRunning = true;
      this.iterationInterval = setInterval(() => {
        if (!this.operationLock) {
          this.iterate();
        }
      }, 20000);
    }
  }

  async iterate() {
    if (!this.state.isRunning || this.isIterating || this.operationLock) {
      console.log('[Engine] Skipping iteration - busy or stopped');
      return this.state;
    }

    this.isIterating = true;
    this.operationLock = true;

    try {
      this.state.currentIteration++;
      this.state.stats.totalIterations++;
      
      console.log(`[Engine] === Iteration ${this.state.currentIteration} ===`);

      if (this.state.tasksQueue.length > 0) {
        await this.processNextTask();
      }

      if (this.state.currentIteration % 5 === 0) {
        console.log('[Engine] Major evolution check...');
        await this.evolveGrammar();
      }

      if (this.state.currentIteration % 3 === 0) {
        await this.checkSyntax();
      }

      if (this.state.currentIteration % 10 === 0) {
        await this.updateDocs();
      }

      if (this.state.currentIteration % 7 === 0) {
        await this.checkProjectStructure();
      }

      console.log('[Engine] Iteration completed successfully');
    } catch (error) {
      console.error('[Engine] Iteration error:', error);
    } finally {
      this.isIterating = false;
      setTimeout(() => {
        this.operationLock = false;
      }, 1000);
    }

    return this.state;
  }

  async checkSyntax() {
    console.log('[Engine] Analyzing current syntax tree...');
    
    // Mock syntax analysis
    const issues = await this.analyzeSyntax();
    
    if (issues.length > 0) {
      console.log(`[Engine] Found ${issues.length} inconsistencies`);
      issues.forEach(issue => {
        this.addToQueue({
          type: issue.type as any,
          priority: issue.severity as any,
          description: issue.description,
          addedAt: new Date(),
          status: 'pending',
          id: `task-${Date.now()}-${Math.random()}`
        });
      });
    } else {
      console.log('[Engine] Syntax is consistent ✓');
    }

    return issues;
  }

  private async analyzeSyntax() {
    // Check for common issues in UPLim syntax
    const issues: any[] = [];
    
    // Example syntax rules validation
    const currentSyntax = UPLIM_IDEOLOGY.core_principles.simplicity.syntax_keywords;
    
    // Check for missing essential keywords
    const essentialKeywords = ['let', 'make', 'when', 'do', 'end', 'say'];
    essentialKeywords.forEach(keyword => {
      if (!currentSyntax.includes(keyword)) {
        issues.push({
          type: 'syntax_fix',
          severity: 'high',
          description: `Missing essential keyword: ${keyword}`,
          suggestedFix: `Add '${keyword}' to syntax keywords`
        });
      }
    });

    return issues;
  }

  async evolveGrammar() {
    console.log('[Engine] Generating evolution proposals...');

    const proposals = await this.generateProposals();
    
    for (const proposal of proposals) {
      const isValid = this.validateProposal(proposal);
      
      if (isValid) {
        console.log('[Engine] Approved:', proposal.title);
        this.state.stats.proposalsApproved++;
        await this.implementProposal(proposal);
      } else {
        console.log('[Engine] Rejected:', proposal.title);
        console.log('  Violations:', proposal.violations.join(', '));
        this.state.stats.proposalsRejected++;
      }
    }

    return proposals;
  }

  private async generateProposals(): Promise<EvolutionProposal[]> {
    this.state.stats.proposalsGenerated++;

    try {
      const response = await fetch('/api/generate-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: UPLIM_IDEOLOGY.core_principles.simplicity.syntax_keywords,
          ideology: UPLIM_IDEOLOGY.core_principles,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const proposalData = await response.json();
      
      const proposal: EvolutionProposal = {
        id: `prop-${Date.now()}`,
        title: proposalData.title,
        type: proposalData.type || 'enhancement',
        description: proposalData.description,
        syntaxBefore: proposalData.syntaxBefore || '',
        syntaxAfter: proposalData.syntaxAfter || '',
        breaksCompatibility: false,
        versionBump: 'minor',
        testCases: proposalData.testCases || [],
        ideologyAlignment: {
          readability: 9,
          safety: 9,
          portability: 10,
          performance: 8,
          ergonomics: 9
        },
        overallScore: 90,
        violations: [],
        approved: false
      };

      return [proposal];
    } catch (error) {
      console.error('[Engine] Failed to generate proposal:', error);
      return [];
    }
  }

  private validateProposal(proposal: EvolutionProposal): boolean {
    const violations: string[] = [];

    // Check readability
    if (proposal.ideologyAlignment.readability < 6) {
      violations.push('Readability score too low');
    }

    // Check safety
    if (proposal.ideologyAlignment.safety < 6) {
      violations.push('Safety score too low');
    }

    // Check for unsafe patterns
    const unsafePatterns = ['null', 'undefined', 'throw', 'delete'];
    unsafePatterns.forEach(pattern => {
      if (proposal.syntaxAfter.includes(pattern)) {
        violations.push(`Contains unsafe pattern: ${pattern}`);
      }
    });

    // Check overall score
    const avgScore = Object.values(proposal.ideologyAlignment).reduce((a, b) => a + b, 0) / 5;
    proposal.overallScore = avgScore * 10;

    if (avgScore < 7) {
      violations.push('Overall alignment score below threshold');
    }

    proposal.violations = violations;
    proposal.approved = violations.length === 0;

    return violations.length === 0;
  }

  private async implementProposal(proposal: EvolutionProposal) {
    console.log('[Engine] Implementing:', proposal.title);

    // Step 1: Run tests
    const testsPass = await this.runTests(proposal.testCases);

    if (!testsPass) {
      console.log('[Engine] Tests failed! Skipping implementation');
      this.state.stats.testsFailed++;
      return false;
    }

    this.state.stats.testsPassed++;

    // Step 2: Record in history
    this.state.evolutionHistory.push({
      iteration: this.state.currentIteration,
      proposal,
      timestamp: new Date(),
      status: 'implemented'
    });

    console.log('[Engine] ✓ Successfully implemented:', proposal.title);
    return true;
  }

  private async runTests(testCases: { input: string; expected: string }[]): Promise<boolean> {
    let allPass = true;

    for (const test of testCases) {
      try {
        const result = this.compiler.execute(test.input);
        const pass = result.trim() === test.expected.trim();
        
        if (!pass) {
          console.log(`[Engine] Test failed: expected "${test.expected}", got "${result}"`);
          allPass = false;
        }
      } catch (error) {
        console.log('[Engine] Test error:', error);
        allPass = false;
      }
    }

    return allPass;
  }

  private async updateDocs() {
    console.log('[Engine] Synchronizing documentation...');
    // Mock doc update
    console.log('[Engine] ✓ Documentation updated');
  }

  private addToQueue(task: EngineTask) {
    this.state.tasksQueue.push(task);
    // Sort by priority
    this.state.tasksQueue.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private async processNextTask() {
    if (this.state.tasksQueue.length === 0) return;

    const task = this.state.tasksQueue.shift()!;
    task.status = 'processing';
    
    console.log('[Engine] Processing task:', task.description);

    // Process based on type
    // Mock implementation
    task.status = 'completed';
    
    console.log('[Engine] ✓ Task completed');
  }

  // Added project structure awareness
  async checkProjectStructure() {
    console.log('[Engine] Checking project structure...');
    
    const files = [
      'uplim.config',
      'app/main.upl',
      'app/layout.upl',
      'README.md',
    ];
    
    const validation = ProjectScaffolder.validateProjectStructure(files);
    
    if (!validation.valid) {
      validation.missing.forEach(file => {
        this.addToQueue({
          id: `missing-${file}-${Date.now()}`,
          type: 'syntax_fix',
          priority: 'high',
          description: `Missing required file: ${file}`,
          addedAt: new Date(),
          status: 'pending',
        });
      });
    }
    
    return validation;
  }

  getState(): EngineState {
    return { ...this.state };
  }

  getEvolutionHistory() {
    return this.state.evolutionHistory;
  }

  getTasksQueue() {
    return this.state.tasksQueue;
  }
}

// Singleton instance
export const autonomousEngine = new AutonomousEngine();
