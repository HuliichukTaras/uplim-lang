import { NextRequest } from 'next/server';
import { UPLimEngine } from '@engine/engine';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return Response.json({ error: 'Invalid code provided' }, { status: 400 });
    }

    // For now, "compile" means checking for syntax errors since we don't have a binary target yet.
    // In the future, this would return WASM or Bytecode.
    const projectRoot = process.cwd();
    const engine = new UPLimEngine(projectRoot);
    
    // We create a temporary analyze method access or similar if needed, 
    // but honestly just running the parser is enough for now.
    // Since verify/compile isn't exposed publicly on engine yet, we will just try to execute
    // and catch parse errors specifically, or just return a success message.
    
    // TODO: Expose a 'compile' or 'check' method on UPLimEngine
    try {
        engine.execute(code); // This throws on syntax error
        return Response.json({
            success: true,
            message: "Compiled successfully (Syntax Check Passed)",
            timestamp: new Date().toISOString()
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
