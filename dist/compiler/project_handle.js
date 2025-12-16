"use strict";
// UPLim Compiler - Project Handle
// Represents a loaded UPLim project
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectHandle = void 0;
class ProjectHandle {
    name;
    rootPath;
    files;
    constructor(name, rootPath, files) {
        this.name = name;
        this.rootPath = rootPath;
        this.files = files;
    }
    getName() {
        return this.name;
    }
    getFilePath() {
        return this.rootPath;
    }
    async loadAllAST() {
        // Mock implementation - in real version, would parse all files
        return this.files.map(file => ({
            type: 'Program',
            file,
            line: 1,
            column: 0,
            children: []
        }));
    }
    isBenchmarkEnabled() {
        // Check if project has benchmark configuration
        return this.files.some(f => f.includes('benchmark'));
    }
    async discoverBenchmarks() {
        // Mock implementation
        return [];
    }
}
exports.ProjectHandle = ProjectHandle;
