export interface Rule {
    id: string;
    category: 'syntax' | 'style' | 'safety' | 'performance';
    severity: 'error' | 'warning' | 'info';
    message: string;
    check: (line: string) => boolean;
    suggestion?: string;
}
export declare const UPLIM_RULES: Rule[];
