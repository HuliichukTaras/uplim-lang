// Engine Module: Profile Storage
// Stores learned patterns and performance profiles

export type StoredProfile = {
  id: string;
  type: 'performance' | 'pattern' | 'security' | 'optimization';
  data: any;
  timestamp: Date;
  metadata: Record<string, any>;
};

export class ProfileStorage {
  private storage: Map<string, StoredProfile> = new Map();
  private maxEntries: number = 10000;

  save_report(report: any) {
    this.save({
      type: 'performance', // Defaulting to performance or generic type
      data: report,
      metadata: { kind: 'full-report' }
    });
  }

  save(profile: Omit<StoredProfile, 'id' | 'timestamp'>): string {
    const id = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const stored: StoredProfile = {
      ...profile,
      id,
      timestamp: new Date(),
    };

    this.storage.set(id, stored);
    this.cleanup();

    return id;
  }

  get(id: string): StoredProfile | undefined {
    return this.storage.get(id);
  }

  query(filter: { type?: string; after?: Date }): StoredProfile[] {
    let results = Array.from(this.storage.values());

    if (filter.type) {
      results = results.filter(p => p.type === filter.type);
    }

    if (filter.after) {
      results = results.filter(p => p.timestamp > filter.after!);
    }

    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getRecentPatterns(count: number = 10): StoredProfile[] {
    return this.query({ type: 'pattern' }).slice(0, count);
  }

  private cleanup() {
    if (this.storage.size > this.maxEntries) {
      const entries = Array.from(this.storage.entries())
        .sort(([, a], [, b]) => a.timestamp.getTime() - b.timestamp.getTime());
      
      const toDelete = entries.slice(0, this.storage.size - this.maxEntries);
      toDelete.forEach(([id]) => this.storage.delete(id));
    }
  }

  clear() {
    this.storage.clear();
  }

  getStats() {
    return {
      total: this.storage.size,
      byType: this.groupByType(),
    };
  }

  private groupByType() {
    const counts: Record<string, number> = {};
    this.storage.forEach(profile => {
      counts[profile.type] = (counts[profile.type] || 0) + 1;
    });
    return counts;
  }
}

export const profileStorage = new ProfileStorage();
