'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function HomePage() {
  const [code, setCode] = useState(`let x = 10
say "Hello UPLim!"
say "x is " plus x
when x greater than 5 do say "x is large!"`);
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
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">U</span>
            </div>
            <span className="text-xl font-bold">UPLim</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#playground" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Playground
            </Link>
            <Link href="/engine" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Engine
            </Link>
            <Link href="/engine">
              <Button size="sm" className="gap-2">
                {'</>'}
                Start Coding
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-24 md:py-32">
        <div className="mx-auto max-w-5xl text-center">
          <Badge className="mb-4 text-xs font-medium" variant="secondary">
            ✨ Universal. Compiled. AI-Powered.
          </Badge>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-balance md:text-7xl">
            The Human Programming Language
          </h1>
          <p className="mb-8 text-xl text-muted-foreground text-balance md:text-2xl">
            Write once, run everywhere. Compile to WebAssembly, native, or JavaScript.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="gap-2" asChild>
              <Link href="#playground">
                ▶ Try It Now
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link href="/engine">
                {'</>'} View Engine
              </Link>
            </Button>
          </div>
          
          {/* Code Preview */}
          <div className="mt-16 rounded-lg border border-border bg-card p-1 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2">
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-muted-foreground">hello.upl</span>
            </div>
            <div className="bg-muted/30 p-6 text-left font-mono text-sm">
              <div className="text-muted-foreground">
                <span className="text-primary">let</span> name <span className="text-primary">be</span> <span className="text-green-600">"UPLim"</span>
              </div>
              <div className="text-muted-foreground">
                <span className="text-primary">say</span> <span className="text-green-600">"Hello"</span> <span className="text-primary">plus</span> name
              </div>
              <div className="mt-2 text-muted-foreground">
                <span className="text-primary">when</span> name <span className="text-primary">equals</span> <span className="text-green-600">"UPLim"</span> <span className="text-primary">do</span>
              </div>
              <div className="pl-4 text-muted-foreground">
                <span className="text-primary">say</span> <span className="text-green-600">"Welcome to the future!"</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-border bg-muted/30 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
              One Language. Everywhere.
            </h2>
            <p className="text-lg text-muted-foreground">
              Universal compilation to WebAssembly, LLVM, and JavaScript
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="h-10 w-10 text-4xl mb-2">🌍</div>
                <CardTitle>Universal Compilation</CardTitle>
                <CardDescription>
                  Compile to WebAssembly for browsers, LLVM IR for native performance, or JavaScript for legacy compatibility. One codebase, any platform.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-10 w-10 text-4xl mb-2">🛡️</div>
                <CardTitle>Safe by Default</CardTitle>
                <CardDescription>
                  No null, no undefined, no crashes. Memory-safe and thread-safe with compiler-enforced guarantees and Result/Option types.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-10 w-10 text-4xl mb-2">⚡</div>
                <CardTitle>Extremely Fast & No GC</CardTitle>
                <CardDescription>
                  Always compiled, never just interpreted. Zero-cost abstractions, minimal runtime, and manual-free memory management without a Garbage Collector.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-10 w-10 text-4xl mb-2">💻</div>
                <CardTitle>Human Syntax</CardTitle>
                <CardDescription>
                  Natural language syntax. Read code like sentences. No complex constructs or cognitive overhead. Perfect for humans.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-10 w-10 text-4xl mb-2">✨</div>
                <CardTitle>AI-Native</CardTitle>
                <CardDescription>
                  Optional AI integration for advanced analysis and suggestions. Self-improving engine for language evolution. You stay in control.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="h-10 w-10 text-4xl mb-2">🔗</div>
                <CardTitle>Full Interoperability</CardTitle>
                <CardDescription>
                  FFI bridges to C, JavaScript, JVM, and .NET. Embed UPLim anywhere or call existing libraries seamlessly.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Playground Section */}
      <section id="playground" className="border-t border-border py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
              Try UPLim Now
            </h2>
            <p className="text-lg text-muted-foreground">
              Write and run UPLim code directly in your browser
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <Card>
              <CardHeader>
                <CardTitle>Code Editor</CardTitle>
                <CardDescription>Write your UPLim code here</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="let x = 10&#10;say &quot;Hello UPLim!&quot;"
                />
                <div className="mt-4 flex gap-2">
                  <Button onClick={runCode} disabled={isRunning} className="gap-2">
                    ▶ {isRunning ? 'Running...' : 'Run Code'}
                  </Button>
                  <Button variant="outline" onClick={() => setOutput('')}>
                    Clear Output
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Output</CardTitle>
                <CardDescription>Program execution results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted p-4 font-mono text-sm min-h-[150px]">
                  {output || <span className="text-muted-foreground">Output will appear here...</span>}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-muted/30 py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-6 text-balance">
              Ready to Build the Future?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 text-balance">
              Join the revolution in programming language design
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/engine">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="https://github.com" target="_blank">View on GitHub</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">U</span>
              </div>
              <span className="font-semibold">UPLim</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              The Human Programming Language. Universal, safe, and simple.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
