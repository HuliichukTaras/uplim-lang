import { NextRequest } from 'next/server';
import { UPLimEngine } from '@engine/engine';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return Response.json({ error: 'Invalid code provided' }, { status: 400 });
    }

    // Proxy to Render backend
    const renderResponse = await fetch('https://uplim-lang.onrender.com/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!renderResponse.ok) {
       const errorText = await renderResponse.text();
       throw new Error(`Render API error: ${renderResponse.status} ${errorText}`);
    }

    const data = await renderResponse.json();

    return Response.json({
      success: true,
      output: data.result || data.error || 'No output', 
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
