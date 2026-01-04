"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initEngine = initEngine;
exports.analyzeProject = analyzeProject;
const rules_registry_1 = require("../rules/rules_registry");
const analysis_1 = require("../analysis/analysis");
const security_1 = require("../security/security");
const tester_1 = require("../tester/tester");
const evolver_1 = require("../evolver/evolver");
const profile_storage_1 = require("../storage/profile_storage");
const ai_client_1 = require("../ai/ai_client");
function initEngine(config) {
    const storage = (0, profile_storage_1.openStorage)(config.performanceProfilePath);
    const rules = (0, rules_registry_1.loadDefaultRules)();
    const aiClient = config.enableAI && config.aiApiKey
        ? (0, ai_client_1.initAIClient)(config.aiProvider, config.aiApiKey)
        : null;
    return {
        config,
        rules,
        storage,
        aiClient,
    };
}
function analyzeProject(ctx, project) {
    console.log('[Engine] Starting project analysis...');
    const analysisResult = (0, analysis_1.runAnalysis)(ctx, project);
    const securityResult = (0, security_1.runSecurityScan)(ctx, project);
    const perfHints = (0, tester_1.maybeBenchmark)(ctx, project);
    const evolution = (0, evolver_1.proposeLanguageChanges)(ctx, analysisResult, securityResult, perfHints);
    (0, profile_storage_1.saveReport)(ctx.storage, project, analysisResult, securityResult, perfHints, evolution);
    console.log('[Engine] Analysis complete');
    return {
        analysis: analysisResult,
        security: securityResult,
        performance: perfHints,
        evolution,
    };
}
