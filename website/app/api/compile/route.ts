import { NextRequest } from 'next/server';

const UPLIM_API_URL = process.env.UPLIM_API_URL || 'https://uplim-lang.onrender.com';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return Response.json({ error: 'Invalid code provided' }, { status: 400 });
    }

        });
    } catch (e: any) {
         return Response.json({
            success: false,
            error: e.message,
            timestamp: new Date().toISOString()
        });
    }
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
