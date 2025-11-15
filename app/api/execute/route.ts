import { uplimInterpreter } from '@/lib/uplim-interpreter';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return Response.json({ error: 'Invalid code provided' }, { status: 400 });
    }

    const output = uplimInterpreter.interpret(code);

    return Response.json({
      success: true,
      output: output || '(no output)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      output: ''
    }, { status: 500 });
  }
}
