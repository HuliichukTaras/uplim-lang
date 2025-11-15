import { RulesRegistry } from '../rules/rules-registry';
import { Analysis } from '../analysis/analysis';
import { Security } from '../security/security';
import { Tester } from '../tester/tester';
import { Evolver } from '../evolver/evolver';
import { ProfileStorage } from '../storage/profile-storage';
import { AIClient, initAIClient } from '../ai/ai-client';
import type { ProjectHandle } from '../../compiler/api/compiler-api';

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
    const storage = new ProfileStorage(config.performanceProfilePath);
    const rules = RulesRegistry.load_default();
    const aiClient = config.enableAI ? initAIClient(config.aiProvider, config.aiApiKey) : null;

    return {
      config,
      rules,
      storage,
      aiClient,
    };
  }

  static analyze_project(ctx: EngineContext, project: ProjectHandle): EngineReport {
    const analysisResult = Analysis.run(ctx, project);
    const securityResult = Security.run(ctx, project);
    const perfHints = Tester.maybe_benchmark(ctx, project);

    const evolution = Evolver.propose_language_changes(
      ctx,
      analysisResult,
      securityResult,
      perfHints
    );

    ctx.storage.save_report({
      analysis: analysisResult,
      security: securityResult,
      performance: perfHints,
      evolution,
    });

    return {
      analysis: analysisResult,
      security: securityResult,
      performance: perfHints,
      evolution,
    };
  }
}
