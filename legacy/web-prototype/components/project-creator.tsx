'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export function ProjectCreator() {
  const [projectName, setProjectName] = useState('my-uplim-app');
  const [features, setFeatures] = useState({
    i18n: false,
    testing: true,
    compiler: false,
  });
  const [target, setTarget] = useState<'cli' | 'web' | 'wasm'>('cli');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const createProject = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/cli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'new',
          args: {
            name: projectName,
            options: {
              targets: [target],
              features,
            },
          },
        }),
      });

      const data = await response.json();
      setOutput(data.output);
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
    setLoading(false);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 p-6">
      <h3 className="text-2xl font-bold mb-6">Create New Project</h3>
      
      <div className="space-y-6">
        <div>
          <Label htmlFor="project-name">Project Name</Label>
          <Input
            id="project-name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-black border-zinc-700 mt-2"
            placeholder="my-uplim-app"
          />
        </div>

        <div>
          <Label>Target Platform</Label>
          <div className="flex gap-2 mt-2">
            {(['cli', 'web', 'wasm'] as const).map((t) => (
              <Button
                key={t}
                variant={target === t ? 'default' : 'outline'}
                onClick={() => setTarget(t)}
                className={target === t ? '' : 'border-zinc-700'}
              >
                {t.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label>Features</Label>
          <div className="space-y-2 mt-2">
            {Object.entries(features).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) =>
                    setFeatures({ ...features, [key]: checked })
                  }
                />
                <Label htmlFor={key} className="cursor-pointer">
                  {key === 'i18n' ? 'Internationalization' : key.charAt(0).toUpperCase() + key.slice(1)}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={createProject} disabled={loading || !projectName} className="w-full">
          {loading ? 'Creating...' : 'Create Project'}
        </Button>

        {output && (
          <pre className="bg-black border border-zinc-800 rounded-lg p-4 text-green-400 font-mono text-sm overflow-auto max-h-[400px] whitespace-pre-wrap">
            {output}
          </pre>
        )}
      </div>
    </Card>
  );
}
