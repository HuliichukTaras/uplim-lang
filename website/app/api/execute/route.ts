
import { NextRequest } from 'next/server';
// Import from workspace package
import { Lexer, UPLimParser, Interpreter } from 'uplim-engine';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return Response.json({ error: 'Invalid code provided' }, { status: 400 });
    }

    // 1. Lexing & Parsing
    // UPLimParser parses source directly
    
    // 2. Parsing
    const parserInstance = new UPLimParser();
    const parseResult = parserInstance.parse(code, 'playground.upl');
    
    if (parseResult.errors.length > 0) {
        return Response.json({
            success: false,
            error: parseResult.errors.map(e => `Line ${e.line}: ${e.message}`).join('\n')
        });
    }

    // 3. Interpreting
    if (!parseResult.ast) {
        return Response.json({ success: false, error: "Parser failed to produce AST" });
    }

    const interpreter = new Interpreter();
    const output = interpreter.interpret(parseResult.ast);

    return Response.json({
      success: true,
      output: output
    });

  } catch (error: any) {
    console.error('Execution error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Unknown execution error'
    }, { status: 500 });
  }
}
