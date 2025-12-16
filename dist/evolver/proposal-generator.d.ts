export type EvolutionProposal = {
    id: string;
    title: string;
    type: 'feature' | 'enhancement' | 'bug_fix' | 'optimization';
    description: string;
    rationale: string;
    syntaxBefore?: string;
    syntaxAfter?: string;
    breaksCompatibility: boolean;
    versionBump: 'major' | 'minor' | 'patch';
    testCases: {
        input: string;
        expected: string;
    }[];
    ideologyAlignment: {
        safety: number;
        simplicity: number;
        speed: number;
        portability: number;
        scalability: number;
    };
    overallScore: number;
    violations: string[];
    approved: boolean;
    generatedAt: Date;
};
export declare class ProposalGenerator {
    generateFromAnalysis(issues: any[]): Promise<EvolutionProposal[]>;
    private createSafetyProposal;
    private createPerformanceProposal;
    createManualProposal(data: Partial<EvolutionProposal>): EvolutionProposal;
}
export declare const proposalGenerator: ProposalGenerator;
