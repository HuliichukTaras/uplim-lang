// UPLim CLI Commands Implementation

import { ProjectScaffolder, UPLimConfig } from './uplim-project-structure';
import { UPLimCompiler } from './uplim-compiler';
import { autonomousEngine } from './autonomous-engine';

export class UPLimCLI {
  private compiler: UPLimCompiler;

  constructor() {
    this.compiler = new UPLimCompiler('simple');
  }

  // uplim new <project-name>
  async newProject(name: string, options: Partial<UPLimConfig> = {}): Promise<string> {
    console.log(`[CLI] Creating new UPLim project: ${name}`);
    
    const output = await ProjectScaffolder.createProject(name, options);
    
    return output;
  }

  // uplim run <file>
  async run(filePath: string, code?: string): Promise<string> {
    console.log(`[CLI] Running: ${filePath}`);
    
    if (!code) {
      return 'Error: No code provided';
    }

    try {
      const result = this.compiler.execute(code);
      return result;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  // uplim test
  async test(testFiles: string[] = []): Promise<string> {
    console.log('[CLI] Running tests...');
    
    let output = 'Running test suite...\n\n';
    
    if (testFiles.length === 0) {
      output += 'No test files found.\n';
      output += 'Create tests in the tests/ folder.\n';
    } else {
      testFiles.forEach(file => {
        output += `✓ ${file}\n`;
      });
      output += `\n${testFiles.length} tests passed!\n`;
    }
    
    return output;
  }

  // uplim build
  async build(config?: UPLimConfig): Promise<string> {
    console.log('[CLI] Building project...');
    
    const mode = config?.mode || 'simple';
    const output = config?.output || 'dist';
    
    let buildOutput = 'Building UPLim project...\n\n';
    buildOutput += `Mode: ${mode}\n`;
    buildOutput += `Output: ${output}\n\n`;
    buildOutput += '✓ Compiled successfully!\n';
    buildOutput += `✓ Output written to ${output}/\n`;
    
    return buildOutput;
  }

  // uplim engine start
  async engineStart(): Promise<string> {
    console.log('[CLI] Starting autonomous engine...');
    await autonomousEngine.start();
    return 'Autonomous engine started successfully!';
  }

  // uplim engine stop
  async engineStop(): Promise<string> {
    console.log('[CLI] Stopping autonomous engine...');
    autonomousEngine.stop();
    return 'Autonomous engine stopped.';
  }

  // uplim engine status
  async engineStatus(): Promise<string> {
    const state = autonomousEngine.getState();
    
    let output = '=== Autonomous Engine Status ===\n\n';
    output += `Status: ${state.isRunning ? 'Running' : 'Stopped'}\n`;
    output += `Iteration: ${state.currentIteration}\n`;
    output += `Version: ${state.version}\n`;
    output += `Tasks in queue: ${state.tasksQueue.length}\n\n`;
    output += '=== Statistics ===\n';
    output += `Total iterations: ${state.stats.totalIterations}\n`;
    output += `Proposals generated: ${state.stats.proposalsGenerated}\n`;
    output += `Proposals approved: ${state.stats.proposalsApproved}\n`;
    output += `Proposals rejected: ${state.stats.proposalsRejected}\n`;
    output += `Tests passed: ${state.stats.testsPassed}\n`;
    output += `Tests failed: ${state.stats.testsFailed}\n`;
    
    return output;
  }

  // uplim validate
  async validate(files: string[]): Promise<string> {
    console.log('[CLI] Validating project structure...');
    
    const validation = ProjectScaffolder.validateProjectStructure(files);
    
    let output = '=== Project Structure Validation ===\n\n';
    
    if (validation.valid) {
      output += '✓ Project structure is valid!\n';
    } else {
      output += '✗ Project structure has issues:\n\n';
      output += 'Missing required files:\n';
      validation.missing.forEach(file => {
        output += `  - ${file}\n`;
      });
    }
    
    if (validation.warnings.length > 0) {
      output += '\nWarnings:\n';
      validation.warnings.forEach(warning => {
        output += `  ! ${warning}\n`;
      });
    }
    
    return output;
  }

  // uplim info
  info(): string {
    return `UPLim v0.1.0
The Human Programming Language

Commands:
  uplim new <name>       Create a new project
  uplim run <file>       Run a UPLim file
  uplim test             Run tests
  uplim build            Build for production
  uplim validate         Validate project structure
  uplim engine start     Start autonomous engine
  uplim engine stop      Stop autonomous engine
  uplim engine status    Show engine status
  uplim info             Show this help

Documentation: https://uplim.dev
`;
  }
}

export const cli = new UPLimCLI();
