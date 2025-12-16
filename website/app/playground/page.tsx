'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function PlaygroundPage() {
  const [code, setCode] = useState(`let greeting be "Hello"
let name be "World"
say greeting plus " " plus name`);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runCode = async () => {
    setIsRunning(true);
    setOutput('Running...');
    
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOutput(data.output);
      } else {
        setOutput(`Error: ${data.error}`);
      }
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">U</span>
            </div>
            <span className="text-xl font-bold">UPLim Playground</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/"><Button variant="ghost" size="sm">Home</Button></Link>
            <Link href="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
            <Link href="/engine"><Button variant="ghost" size="sm">Engine</Button></Link>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">UPLim Playground</h1>
          <p className="text-muted-foreground">Try UPLim code in your browser</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Code Editor</CardTitle>
              <CardDescription>Write UPLim code using natural language syntax</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Write your UPLim code here..."
              />
              <div className="flex gap-2">
                <Button onClick={runCode} disabled={isRunning} className="gap-2">
                  ▶ {isRunning ? 'Running...' : 'Run Code'}
                </Button>
                <Button variant="outline" onClick={() => setCode('')}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Output</CardTitle>
              <CardDescription>Program execution results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md bg-muted p-4 font-mono text-sm min-h-[400px] whitespace-pre-wrap">
                {output || <span className="text-muted-foreground">Output will appear here...</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Example Programs</CardTitle>
              <CardDescription>Try these examples to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start font-mono text-sm"
                onClick={() => setCode(`let x be 10\nlet y be 20\nlet sum be x plus y\nsay "Sum is:" sum`)}
              >
                Variables and Math
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start font-mono text-sm"
                onClick={() => setCode(`let name be "UPLim"\nwhen name equals "UPLim" do say "Welcome!"`)}
              >
                Conditionals
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start font-mono text-sm"
                onClick={() => setCode(`let a = 100\nlet b = 50\nsay "a + b =" plus a + b\nwhen a greater than b do say "a is greater!"`)}
              >
                Math Operations
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
