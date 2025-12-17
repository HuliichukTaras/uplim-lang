import { NextRequest } from 'next/server';

const UPLIM_API_URL = process.env.UPLIM_API_URL || 'https://uplim-lang.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return Response.json({ error: 'Invalid code provided' }, { status: 400 });
    }

    // Proxy to Render Backend
    const backendResponse = await fetch(`${UPLIM_API_URL}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!backendResponse.ok) {
       throw new Error(`Backend responded with ${backendResponse.status}`);
    }

    const data = await backendResponse.json();

    // Map Backend response { result, error } to Frontend expectation { success, output, error }
    return Response.json({
      success: !data.error,
      output: data.result || '',
      error: data.error,
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
