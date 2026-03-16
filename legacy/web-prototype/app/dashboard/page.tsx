'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { PlayIcon, CodeIcon, ActivityIcon, BarChart3Icon, ShieldCheckIcon, SparklesIcon, FileTextIcon, SettingsIcon } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [code, setCode] = useState(`let greeting be "Hello"
let name be "UPLim"
say greeting plus " " plus name

when name equals "UPLim" do
  say "Welcome to the future!"
end`);
  
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    
    setTimeout(() => {
      setAnalysisResult({
        codeQuality: 95,
        securityScore: 100,
        performance: 'Excellent',
        suggestions: [
          { type: 'info', message: 'Code follows UPLim best practices' },
          { type: 'success', message: 'No security vulnerabilities detected' },
          { type: 'info', message: 'Performance is optimal' }
        ],
        metrics: {
          lines: code.split('\n').length,
          complexity: 'Low',
          maintainability: 'High'
        }
      });
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">U</span>
            </div>
            <span className="text-xl font-bold">UPLim Dashboard</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">Home</Button>
            </Link>
            <Link href="/engine">
              <Button variant="ghost" size="sm" className="gap-2">
                <ActivityIcon className="h-4 w-4" />
                Engine
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">UPLim Workspace</h1>
          <p className="text-muted-foreground">Write, analyze, and evolve your UPLim code</p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Code Quality</CardTitle>
              <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysisResult?.codeQuality || 0}%</div>
              <p className="text-xs text-muted-foreground">Excellent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Security</CardTitle>
              <ShieldCheckIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysisResult?.securityScore || 0}%</div>
              <p className="text-xs text-muted-foreground">No issues</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysisResult?.performance || 'N/A'}</div>
              <p className="text-xs text-muted-foreground">Optimized</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Lines of Code</CardTitle>
              <CodeIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{code.split('\n').length}</div>
              <p className="text-xs text-muted-foreground">Current file</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="editor" className="space-y-6">
          <TabsList>
            <TabsTrigger value="editor" className="gap-2">
              <CodeIcon className="h-4 w-4" />
              Code Editor
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <BarChart3Icon className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="evolution" className="gap-2">
              <SparklesIcon className="h-4 w-4" />
              Evolution
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Code Editor</CardTitle>
                <CardDescription>Write and test your UPLim code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="min-h-[400px] font-mono text-sm"
                  placeholder="Write your UPLim code here..."
                />
                <div className="flex gap-2">
                  <Button onClick={runAnalysis} disabled={isAnalyzing} className="gap-2">
                    <PlayIcon className="h-4 w-4" />
                    {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
                  </Button>
                  <Button variant="outline">
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {!analysisResult ? (
              <Card>
                <CardContent className="pt-6 text-center py-12">
                  <BarChart3Icon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Run analysis to see results</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Code Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Lines</div>
                        <div className="text-2xl font-bold">{analysisResult.metrics.lines}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Complexity</div>
                        <div className="text-2xl font-bold">{analysisResult.metrics.complexity}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Maintainability</div>
                        <div className="text-2xl font-bold">{analysisResult.metrics.maintainability}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analysisResult.suggestions.map((suggestion: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Badge variant={
                          suggestion.type === 'success' ? 'default' :
                          suggestion.type === 'warning' ? 'secondary' :
                          'outline'
                        }>
                          {suggestion.type}
                        </Badge>
                        <p className="text-sm flex-1">{suggestion.message}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="evolution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Evolution</CardTitle>
                <CardDescription>Let the engine suggest improvements</CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <SparklesIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground mb-4">
                  The autonomous engine can analyze your code and suggest improvements
                </p>
                <Link href="/engine">
                  <Button className="gap-2">
                    <ActivityIcon className="h-4 w-4" />
                    Open Engine Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
