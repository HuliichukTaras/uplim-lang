import { NextRequest } from 'next/server';
import { UPLimEngine } from '@engine/engine';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return Response.json({ error: 'Invalid code provided' }, { status: 400 });
    }

    // Initialize Engine
    // We pass process.cwd() as projectRoot. In Vercel, this is usually the root of the running lambda.
    // The engine uses this for storage/reports, which might not be writable in serverless,
    // but execute() doesn't use storage, so it should be fine.
    const projectRoot = process.cwd();
    const engine = new UPLimEngine(projectRoot);

    // Execute directly
    // engine.execute returns string[] of output lines
    const outputLines = engine.execute(code);
    const output = outputLines.join('\n');

    return Response.json({
      success: true,
      output: output,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API execution error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      output: ''
    }, { status: 500 });
  }
}
