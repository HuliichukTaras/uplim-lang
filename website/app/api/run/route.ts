import { NextRequest } from 'next/server';
import { UPLimEngine } from '@engine/engine';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return Response.json({ error: 'Invalid code provided' }, { status: 400 });
    }

    const projectRoot = process.cwd();
    const engine = new UPLimEngine(projectRoot);

    const outputLines = engine.execute(code);
    const output = outputLines.join('\n');

    return Response.json({
      success: true,
      output: output,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API run error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      output: ''
    }, { status: 500 });
  }
}
