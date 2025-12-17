"use strict";
// Storage Module - persists analysis results
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Storage = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class Storage {
    reportsDir;
    constructor(projectRoot) {
        this.reportsDir = path.join(projectRoot, '.uplim', 'reports');
        this.ensureDirectoryExists();
    }
    ensureDirectoryExists() {
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }
    saveReport(report) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `report-${timestamp}.json`;
        const filepath = path.join(this.reportsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        // Also save as "latest"
        const latestPath = path.join(this.reportsDir, 'latest.json');
        fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));
        return filepath;
    }
    loadLatestReport() {
        const latestPath = path.join(this.reportsDir, 'latest.json');
        if (!fs.existsSync(latestPath)) {
            return null;
        }
        const content = fs.readFileSync(latestPath, 'utf-8');
        return JSON.parse(content);
    }
    getReportHistory(limit = 10) {
        const files = fs.readdirSync(this.reportsDir)
            .filter(f => f.startsWith('report-') && f.endsWith('.json'))
            .sort()
            .reverse()
            .slice(0, limit);
        return files.map(file => {
            const content = fs.readFileSync(path.join(this.reportsDir, file), 'utf-8');
            return JSON.parse(content);
        });
    }
}
exports.Storage = Storage;
