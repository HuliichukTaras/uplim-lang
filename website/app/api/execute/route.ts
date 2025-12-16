import { NextRequest } from 'next/server';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return Response.json({ error: 'Invalid code provided' }, { status: 400 });
    }

    // Create a temporary file for the code
    const tmpDir = os.tmpdir();
    const tmpFilePath = path.join(tmpDir, `playground_${Date.now()}.upl`);
    
    await writeFileAsync(tmpFilePath, code);

    // Path to the CLI - assuming we are running from website root, and src is at ../src
    // In production this needs to be adjusted or the engine compiled to a package
    const projectRoot = path.resolve(process.cwd(), '..'); 
    const cliPath = path.join(projectRoot, 'src', 'cli.ts');
    
    // Command to run the CLI
    // We use npx tsx to run the typescript file directly
    const command = `npx tsx "${cliPath}" run "${tmpFilePath}"`;

    let output = '';
    try {
        const { stdout, stderr } = await execAsync(command, { cwd: projectRoot });
        output = stdout || stderr;
    } catch (e: any) {
        // Capture stderr from the process if it failed
        output = e.stdout + '\n' + e.stderr;
    }

    // Cleanup
    await unlinkAsync(tmpFilePath).catch(() => {});

    return Response.json({
      success: true,
      output: output.trim(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      output: ''
    }, { status: 500 });
  }
}
