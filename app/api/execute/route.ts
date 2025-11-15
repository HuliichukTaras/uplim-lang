import { uplimInterpreter } from '@/lib/uplim-interpreter';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Execute API called');
    const { code } = await request.json();
    console.log('[v0] Received code:', code);

    if (!code || typeof code !== 'string') {
      console.log('[v0] Invalid code provided');
      return Response.json({ error: 'Invalid code provided' }, { status: 400 });
    }

    const output = uplimInterpreter.interpret(code);
    console.log('[v0] Interpreter output:', output);

    return Response.json({
      success: true,
      output: output || '(no output)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('[v0] Error in execute API:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      output: ''
    }, { status: 500 });
  }
}
