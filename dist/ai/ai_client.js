"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAIClient = initAIClient;
exports.suggestImprovements = suggestImprovements;
function initAIClient(provider, apiKey) {
    if (!apiKey)
        return null;
    console.log(`[AI] Initializing ${provider} client`);
    return {
        provider,
        apiKey
    };
}
async function suggestImprovements(client, request) {
    console.log(`[AI] Requesting suggestions for ${request.kind}`);
    try {
        // Call the generate-proposal API
        const response = await fetch('/api/generate-proposal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                context: JSON.stringify(request.payload),
                model: process.env.OLLAMA_MODEL || 'openai/gpt-4o-mini'
            })
        });
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        const data = await response.json();
        return {
            success: true,
            suggestions: data.suggestions || []
        };
    }
    catch (error) {
        console.error('[AI] Failed to get suggestions:', error);
        return {
            success: false,
            suggestions: []
        };
    }
}
