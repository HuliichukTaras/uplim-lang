import { RulesRegistry } from '../rules/rules-registry';
import { Analysis } from '../analysis/analysis';
import { Security } from '../security/security';
import { Tester } from '../tester/tester';
import { Evolver } from '../evolver/evolver';
import { ProfileStorage } from '../storage/profile-storage';
import { AIClient, initAIClient } from '../ai/ai-client';
import type { ProjectHandle } from '../compiler/api/compiler-api';
export type { ProjectHandle };

export interface EngineConfig {
  enableAI: boolean;
  aiProvider: string;
  aiApiKey: string | null;
  performanceProfilePath: string;
}

export interface EngineContext {
  config: EngineConfig;
  rules: RulesRegistry;
  storage: ProfileStorage;
  aiClient: AIClient | null;
}

export interface EngineReport {
  analysis: any;
  security: any;
  performance: any;
  evolution: string[];
}

export class EngineMain {
  static init_engine(config: EngineConfig): EngineContext {
    const storage = new ProfileStorage(); // Removed argument as constructor expects 0
    const rules = RulesRegistry.load_default();
    const aiClient = config.enableAI && config.aiApiKey ? initAIClient(config.aiProvider, config.aiApiKey) : null;

    return {
      config,
      rules,
      storage,
      aiClient,
    };
  }

  static analyze_project(ctx: EngineContext, project: ProjectHandle): EngineReport {
    const analysisResult = Analysis.run(ctx, project);
    const securityResult = Security.runScan(ctx, project);
    const perfHints = Tester.benchmark(ctx, project);

    const evolution = Evolver.propose(
      ctx,
      analysisResult,
      securityResult,
      perfHints
    ).merged; // Extract merged suggestions string[]

    const report: EngineReport = {
      analysis: analysisResult,
      security: securityResult,
      performance: perfHints,
      evolution,
    };

    ctx.storage.save_report(report);

    return report;
  }
}
