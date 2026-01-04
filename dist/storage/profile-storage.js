"use strict";
// Engine Module: Profile Storage
// Stores learned patterns and performance profiles
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileStorage = exports.ProfileStorage = void 0;
class ProfileStorage {
    storage = new Map();
    maxEntries = 10000;
    save_report(report) {
        this.save({
            type: 'performance', // Defaulting to performance or generic type
            data: report,
            metadata: { kind: 'full-report' }
        });
    }
    save(profile) {
        const id = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const stored = {
            ...profile,
            id,
            timestamp: new Date(),
        };
        this.storage.set(id, stored);
        this.cleanup();
        return id;
    }
    get(id) {
        return this.storage.get(id);
    }
    query(filter) {
        let results = Array.from(this.storage.values());
        if (filter.type) {
            results = results.filter(p => p.type === filter.type);
        }
        if (filter.after) {
            results = results.filter(p => p.timestamp > filter.after);
        }
        return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    getRecentPatterns(count = 10) {
        return this.query({ type: 'pattern' }).slice(0, count);
    }
    cleanup() {
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
    groupByType() {
        const counts = {};
        this.storage.forEach(profile => {
            counts[profile.type] = (counts[profile.type] || 0) + 1;
        });
        return counts;
    }
}
exports.ProfileStorage = ProfileStorage;
exports.profileStorage = new ProfileStorage();
