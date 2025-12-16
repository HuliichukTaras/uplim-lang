export type StoredProfile = {
    id: string;
    type: 'performance' | 'pattern' | 'security' | 'optimization';
    data: any;
    timestamp: Date;
    metadata: Record<string, any>;
};
export declare class ProfileStorage {
    private storage;
    private maxEntries;
    save_report(report: any): void;
    save(profile: Omit<StoredProfile, 'id' | 'timestamp'>): string;
    get(id: string): StoredProfile | undefined;
    query(filter: {
        type?: string;
        after?: Date;
    }): StoredProfile[];
    getRecentPatterns(count?: number): StoredProfile[];
    private cleanup;
    clear(): void;
    getStats(): {
        total: number;
        byType: Record<string, number>;
    };
    private groupByType;
}
export declare const profileStorage: ProfileStorage;
