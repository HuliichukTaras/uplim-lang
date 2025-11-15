'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export default function CLIPage() {
  const [command, setCommand] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState('say "Hello from UPLim!"');

  const executeCommand = async (cmd: string, args: any = {}, codeToRun?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/cli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, args, code: codeToRun }),
      });

      const data = await response.json();
      setOutput(data.output || data.error || 'No output');
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setLoading(false);
  };

  const quickCommands = [
    { label: 'New Project', cmd: 'new', args: { name: 'my-app' } },
    { label: 'Run Code', cmd: 'run', args: { file: 'main.upl' }, useCode: true },
    { label: 'Run Tests', cmd: 'test', args: {} },
    { label: 'Build', cmd: 'build', args: {} },
    { label: 'Validate', cmd: 'validate', args: { files: ['uplim.config', 'app/main.upl'] } },
    { label: 'Info', cmd: 'info', args: {} },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            UPLim CLI
          </h1>
          <p className="text-gray-400 text-lg">
            Command-line interface for UPLim projects
          </p>
        </div>

        {/* Code Editor for Run Command */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h3 className="text-xl font-semibold mb-4">Code Editor</h3>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="font-mono bg-black border-zinc-700 text-green-400 min-h-[200px]"
            placeholder="Write your UPLim code here..."
          />
        </Card>

        {/* Quick Commands */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h3 className="text-xl font-semibold mb-4">Quick Commands</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {quickCommands.map((qc) => (
              <Button
                key={qc.cmd}
                onClick={() => executeCommand(qc.cmd, qc.args, qc.useCode ? code : undefined)}
                disabled={loading}
                variant="outline"
                className="border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-500"
              >
                {qc.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Custom Command */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h3 className="text-xl font-semibold mb-4">Custom Command</h3>
          <div className="flex gap-2">
            <Input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="uplim new my-app"
              className="bg-black border-zinc-700"
            />
            <Button
              onClick={() => {
                const [cmd, ...argsParts] = command.split(' ');
                executeCommand(cmd, { name: argsParts[0] });
              }}
              disabled={loading || !command}
            >
              Execute
            </Button>
          </div>
        </Card>

        {/* Output Terminal */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h3 className="text-xl font-semibold mb-4">Output</h3>
          <pre className="bg-black border border-zinc-800 rounded-lg p-4 text-green-400 font-mono text-sm overflow-auto max-h-[500px] whitespace-pre-wrap">
            {loading ? 'Executing...' : output || 'No output yet. Run a command to see results.'}
          </pre>
        </Card>

        {/* Architecture Info */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <h3 className="text-xl font-semibold mb-4">Project Structure</h3>
          <pre className="text-sm text-gray-400 font-mono">
{`uplim-project/
├── app/                  # Entry point, routes, pages
│   ├── main.upl         # Main file
│   ├── layout.upl       # Global layout
│   └── pages/           # Application pages
├── components/          # Reusable components
├── types/               # Type definitions
├── lang/                # Internationalization
├── examples/            # Example code
├── tests/               # Test files
├── docs/                # Documentation
├── public/              # Web assets
└── uplim.config         # Configuration file`}
          </pre>
        </Card>
      </div>
    </div>
  );
}
