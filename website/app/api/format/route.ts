import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return Response.json({ error: 'Invalid code provided' }, { status: 400 });
    }

    // Placeholder: Return code as is until a Formatter class is implemented in the Engine.
    // TODO: Implement Formatter in src/formatter.ts and expose via Engine.
    
    return Response.json({
      success: true,
      formatted: code, // No-op for now
      message: "Formatter not yet implemented engine-side",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
