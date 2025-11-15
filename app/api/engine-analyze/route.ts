// API Route: Engine Analysis Endpoint

import { engineAPI } from '@/engine/interface/engine-api';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return Response.json({ error: 'Code is required' }, { status: 400 });
    }

    const analysis = await engineAPI.analyzeCode(code);

    return Response.json(analysis);
  } catch (error) {
    console.error('[Engine API] Analysis error:', error);
    return Response.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
