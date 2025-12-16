"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineMain = void 0;
const rules_registry_1 = require("../rules/rules-registry");
const analysis_1 = require("../analysis/analysis");
const security_1 = require("../security/security");
const tester_1 = require("../tester/tester");
const evolver_1 = require("../evolver/evolver");
const profile_storage_1 = require("../storage/profile-storage");
const ai_client_1 = require("../ai/ai-client");
class EngineMain {
    static init_engine(config) {
        const storage = new profile_storage_1.ProfileStorage(); // Removed argument as constructor expects 0
        const rules = rules_registry_1.RulesRegistry.load_default();
        const aiClient = config.enableAI && config.aiApiKey ? (0, ai_client_1.initAIClient)(config.aiProvider, config.aiApiKey) : null;
        return {
            config,
            rules,
            storage,
            aiClient,
        };
    }
    static analyze_project(ctx, project) {
        const analysisResult = analysis_1.Analysis.run(ctx, project);
        const securityResult = security_1.Security.runScan(ctx, project);
        const perfHints = tester_1.Tester.benchmark(ctx, project);
        const evolution = evolver_1.Evolver.propose(ctx, analysisResult, securityResult, perfHints).merged; // Extract merged suggestions string[]
        const report = {
            analysis: analysisResult,
            security: securityResult,
            performance: perfHints,
            evolution,
        };
        ctx.storage.save_report(report);
        return report;
    }
}
exports.EngineMain = EngineMain;
