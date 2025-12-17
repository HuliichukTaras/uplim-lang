export declare class ProjectHandle {
    private name;
    private rootPath;
    private files;
    constructor(name: string, rootPath: string, files: string[]);
    getName(): string;
    getFilePath(): string;
    loadAllAST(): Promise<any[]>;
    isBenchmarkEnabled(): boolean;
    discoverBenchmarks(): Promise<any[]>;
}
