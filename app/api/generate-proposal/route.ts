import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] API route called - generating proposal');
    
    const { keywords, ideology } = await request.json();
    console.log('[v0] Received keywords:', keywords?.length, 'ideology:', !!ideology);

    const modelName = process.env.OLLAMA_MODEL || 'openai/gpt-4o-mini';
    console.log('[v0] Using model:', modelName);

    // Mock proposal generation without AI SDK
    const proposalData = {
      title: "Enhanced Pattern Matching",
      type: "feature",
      description: "Add more powerful pattern matching for complex data structures",
      syntaxBefore: "when x equals 5 do",
      syntaxAfter: "match x do\n  case 5: say 'five'\n  case _: say 'other'\nend",
      testCases: [
        { input: "match 5", expected: "'five'" },
        { input: "match 10", expected: "'other'" }
      ]
    };
    
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
