import { NextResponse } from 'next/server';
import { autonomousEngine } from '@/lib/autonomous-engine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'status':
        return NextResponse.json(autonomousEngine.getState());
      
      case 'history':
        return NextResponse.json(autonomousEngine.getEvolutionHistory());
      
      case 'queue':
        return NextResponse.json(autonomousEngine.getTasksQueue());
      
      default:
        return NextResponse.json(autonomousEngine.getState());
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get engine status' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { action } = await request.json();

  try {
    let result;
    
    switch (action) {
      case 'start':
        result = await autonomousEngine.start();
        break;
      
      case 'stop':
        result = autonomousEngine.stop();
        break;
      
      case 'pause':
        autonomousEngine.pause();
        result = autonomousEngine.getState();
        break;
      
      case 'resume':
        autonomousEngine.resume();
        result = autonomousEngine.getState();
        break;
      
      case 'iterate':
        result = await autonomousEngine.iterate();
        break;
      
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Engine operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
