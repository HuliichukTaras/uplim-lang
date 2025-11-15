import { uplimInterpreter } from '@/lib/uplim-interpreter';
import { NextRequest } from 'next/server';
import { saveExecution } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Execute API called');
    const { code } = await request.json();
    console.log('[v0] Received code:', code);

    if (!code || typeof code !== 'string') {
      console.log('[v0] Invalid code provided');
      return Response.json({ error: 'Invalid code provided' }, { status: 400 });
    }

    const startTime = Date.now();
    const output = uplimInterpreter.interpret(code);
    const duration = Date.now() - startTime;
    console.log('[v0] Interpreter output:', output);

    try {
      await saveExecution({
        status: 'idle',
        code,
        output: output || '(no output)',
        error: null,
        metrics: { duration_ms: duration },
        completed_at: new Date().toISOString(),
        duration_ms: duration
      });
      console.log('[v0] Execution saved to database');
    } catch (dbError) {
      console.error('[v0] Failed to save to database:', dbError);
      // Continue even if DB save fails
    }

    return Response.json({
      success: true,
      output: output || '(no output)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('[v0] Error in execute API:', error);
    
    try {
      await saveExecution({
        status: 'error',
        code: (await request.json()).code || '',
        output: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {},
        completed_at: new Date().toISOString(),
        duration_ms: 0
      });
    } catch {
      // Ignore DB errors during error handling
    }

    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      output: ''
    }, { status: 500 });
  }
}
