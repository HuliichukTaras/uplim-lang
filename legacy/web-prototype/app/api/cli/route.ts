// API Route for CLI commands
import { NextRequest, NextResponse } from 'next/server';
import { cli } from '@/lib/uplim-cli';

export async function POST(request: NextRequest) {
  try {
    const { command, args, code } = await request.json();

    let result: string;

    switch (command) {
      case 'new':
        result = await cli.newProject(args.name || 'my-app', args.options);
        break;
      case 'run':
        result = await cli.run(args.file, code);
        break;
      case 'test':
        result = await cli.test(args.files);
        break;
      case 'build':
        result = await cli.build(args.config);
        break;
      case 'validate':
        result = await cli.validate(args.files || []);
        break;
      case 'engine-start':
        result = await cli.engineStart();
        break;
      case 'engine-stop':
        result = await cli.engineStop();
        break;
      case 'engine-status':
        result = await cli.engineStatus();
        break;
      case 'info':
        result = cli.info();
        break;
      default:
        result = 'Unknown command';
    }

    return NextResponse.json({ success: true, output: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
