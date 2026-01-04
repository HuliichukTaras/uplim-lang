export type LSPDiagnostic = {
    range: {
        start: {
            line: number;
            character: number;
        };
        end: {
            line: number;
            character: number;
        };
    };
    severity: 1 | 2 | 3 | 4;
    message: string;
    source: string;
    code?: string;
};
export type CompletionItem = {
    label: string;
    kind: number;
    detail?: string;
    documentation?: string;
    insertText?: string;
};
export type SignatureHelp = {
    signatures: Array<{
        label: string;
        documentation?: string;
        parameters: Array<{
            label: string;
            documentation?: string;
        }>;
    }>;
    activeSignature: number;
    activeParameter: number;
};
export declare class LSPServer {
    private documents;
    openDocument(uri: string, text: string): LSPDiagnostic[];
    updateDocument(uri: string, text: string): LSPDiagnostic[];
    closeDocument(uri: string): void;
    validateDocument(uri: string): LSPDiagnostic[];
    private issueToDiagnostic;
    provideCompletionItems(uri: string, line: number, character: number): CompletionItem[];
    provideSignatureHelp(uri: string, line: number, character: number): SignatureHelp | null;
    provideHover(uri: string, line: number, character: number): {
        contents: string;
    } | null;
    formatDocument(uri: string): {
        range: any;
        newText: string;
    }[];
}
export declare const lspServer: LSPServer;
