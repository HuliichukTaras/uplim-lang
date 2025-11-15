import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] API route called - generating proposal');
    
    const { keywords, ideology } = await request.json();
    console.log('[v0] Received keywords:', keywords?.length, 'ideology:', !!ideology);

    const modelName = process.env.OLLAMA_MODEL || 'openai/gpt-4o-mini';
    console.log('[v0] Using model:', modelName);

    const { text } = await generateText({
      model: modelName,
      prompt: `Analyze the current UPLim language and propose ONE small improvement that:
1. Improves developer experience
2. Maintains simplicity
3. Enhances safety
4. Stays consistent with existing syntax

Current keywords: ${keywords.join(', ')}

Respond with JSON:
{
  "title": "Short title",
  "type": "feature|enhancement|optimization",
  "description": "What it does",
  "syntaxBefore": "old way",
  "syntaxAfter": "new way",
  "testCases": [{"input": "example", "expected": "result"}]
}`,
      system: `You are the UPLim language architect. Generate proposals that strictly follow the ideology: ${JSON.stringify(ideology)}`,
      maxTokens: 1000,
      temperature: 0.7,
    });

    console.log('[v0] Generated text length:', text?.length);

    if (!text) {
      throw new Error('Empty response from AI model');
    }

    const proposalData = JSON.parse(text);
    console.log('[v0] Successfully parsed proposal:', proposalData.title);
    
    return NextResponse.json(proposalData);
  } catch (error: any) {
    console.error('[v0] API Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to generate proposal',
        details: error.stack,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
