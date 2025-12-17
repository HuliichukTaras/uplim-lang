'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PlayIcon, PauseIcon, StopCircleIcon, RefreshCwIcon, ActivityIcon, CheckCircle2Icon, XCircleIcon, ClockIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import type { EngineState } from '@/lib/autonomous-engine';

export default function EnginePage() {
  const [engineState, setEngineState] = useState<EngineState | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEngineStatus = async () => {
    try {
      const response = await fetch('/api/engine?action=status');
      const data = await response.json();
      setEngineState(data);
    } catch (error) {
      console.error('Failed to fetch engine status:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/engine?action=history');
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const fetchQueue = async () => {
    try {
      const response = await fetch('/api/engine?action=queue');
      const data = await response.json();
      setQueue(data);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
    }
  };

  useEffect(() => {
    fetchEngineStatus();
    fetchHistory();
    fetchQueue();

    const interval = setInterval(() => {
      fetchEngineStatus();
      fetchHistory();
      fetchQueue();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string) => {
    if (loading) {
      console.log('[UI] Action already in progress');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      if (!response.ok) {
        throw new Error('Engine action failed');
      }
      
      const data = await response.json();
      setEngineState(data);
      
      setTimeout(() => {
        fetchEngineStatus();
        fetchHistory();
        fetchQueue();
      }, 3000);
    } catch (error) {
      console.error('Failed to execute action:', error);
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
  };

  if (!engineState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCwIcon className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading engine status...</p>
        </div>
      </div>
    );
  }

  const alignmentScore = engineState.stats.proposalsGenerated > 0
    ? (engineState.stats.proposalsApproved / engineState.stats.proposalsGenerated) * 100
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/40 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">U</span>
            </div>
            <span className="text-xl font-bold">UPLim Engine</span>
          </Link>
          <div className="flex items-center gap-4">
            <Badge variant={engineState.isRunning ? 'default' : 'secondary'} className="gap-1">
              <ActivityIcon className="h-3 w-3" />
              {engineState.isRunning ? 'Running' : 'Stopped'}
            </Badge>
            <Link href="/">
              <Button variant="outline" size="sm">Back to Home</Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        {/* Control Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Engine Controls</CardTitle>
            <CardDescription>Manage the autonomous evolution engine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => handleAction('start')}
                disabled={engineState.isRunning || loading}
                className="gap-2"
              >
                <PlayIcon className="h-4 w-4" />
                Start Engine
              </Button>
              <Button
                onClick={() => handleAction('pause')}
                disabled={!engineState.isRunning || loading}
                variant="outline"
                className="gap-2"
              >
                <PauseIcon className="h-4 w-4" />
                Pause
              </Button>
              <Button
                onClick={() => handleAction('resume')}
                disabled={engineState.isRunning || loading}
                variant="outline"
                className="gap-2"
              >
                <PlayIcon className="h-4 w-4" />
                Resume
              </Button>
              <Button
                onClick={() => handleAction('stop')}
                disabled={!engineState.isRunning || loading}
                variant="destructive"
                className="gap-2"
              >
                <StopCircleIcon className="h-4 w-4" />
                Stop Engine
              </Button>
              <Button
                onClick={() => handleAction('iterate')}
                disabled={loading}
                variant="secondary"
                className="gap-2"
              >
                <RefreshCwIcon className="h-4 w-4" />
                Run One Iteration
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Current Iteration</CardDescription>
              <CardTitle className="text-4xl">{engineState.currentIteration}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Total: {engineState.stats.totalIterations}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Proposals</CardDescription>
              <CardTitle className="text-4xl">{engineState.stats.proposalsGenerated}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2Icon className="h-3 w-3" />
                  {engineState.stats.proposalsApproved} approved
                </div>
                <div className="flex items-center gap-1 text-red-600">
                  <XCircleIcon className="h-3 w-3" />
                  {engineState.stats.proposalsRejected} rejected
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Tests</CardDescription>
              <CardTitle className="text-4xl">
                {engineState.stats.testsPassed + engineState.stats.testsFailed}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 text-xs">
                <div className="text-green-600">{engineState.stats.testsPassed} passed</div>
                <div className="text-red-600">{engineState.stats.testsFailed} failed</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Ideology Alignment</CardDescription>
              <CardTitle className="text-4xl">{Math.round(alignmentScore)}%</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={alignmentScore} className="h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history" className="space-y-6">
          <TabsList>
            <TabsTrigger value="history">Evolution History</TabsTrigger>
            <TabsTrigger value="queue">Tasks Queue</TabsTrigger>
            <TabsTrigger value="logs">System Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Evolution History</CardTitle>
                <CardDescription>Recent language improvements and changes</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ClockIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No evolution history yet. Start the engine to begin.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item, index) => (
                      <div key={index} className="border-l-2 border-primary pl-4 py-2">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{item.proposal.title}</h4>
                            <p className="text-sm text-muted-foreground">{item.proposal.description}</p>
                          </div>
                          <Badge variant={item.status === 'implemented' ? 'default' : 'destructive'}>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>Iteration {item.iteration}</span>
                          <span>•</span>
                          <span>{new Date(item.timestamp).toLocaleString()}</span>
                          <span>•</span>
                          <span>Score: {item.proposal.overallScore}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="queue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tasks Queue</CardTitle>
                <CardDescription>{queue.length} pending tasks</CardDescription>
              </CardHeader>
              <CardContent>
                {queue.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2Icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No pending tasks. Queue is clear!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queue.map((task, index) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{task.type}</Badge>
                            <Badge
                              variant={
                                task.priority === 'critical' ? 'destructive' :
                                task.priority === 'high' ? 'default' :
                                'secondary'
                              }
                            >
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm">{task.description}</p>
                        </div>
                        <Badge variant="secondary">{task.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>System Logs</CardTitle>
                <CardDescription>Real-time engine activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs space-y-1 max-h-[500px] overflow-y-auto">
                  <div className="text-green-600">[Engine] System initialized</div>
                  <div className="text-blue-600">[Engine] Current iteration: {engineState.currentIteration}</div>
                  <div className="text-yellow-600">[Engine] Status: {engineState.isRunning ? 'Running' : 'Stopped'}</div>
                  <div className="text-muted-foreground">[Engine] Version: {engineState.version}</div>
                  <div className="text-muted-foreground">[Engine] Monitoring active...</div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
