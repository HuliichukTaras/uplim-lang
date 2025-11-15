'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { SparklesIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon } from 'lucide-react';
import { evolutionEngine, type EvolutionProposal } from '@/lib/ai-evolution-engine';

export default function EvolutionPage() {
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposals, setProposals] = useState<EvolutionProposal[]>([]);
  const [error, setError] = useState('');

  const generateProposal = async () => {
    if (!context.trim()) {
      setError('Please provide context for evolution');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      const proposal = await evolutionEngine.generateEvolutionProposal(context);
      setProposals([proposal, ...proposals]);
      setContext('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate proposal');
    } finally {
      setIsGenerating(false);
    }
  };

  const approveProposal = (id: string) => {
    if (evolutionEngine.approveProposal(id)) {
      setProposals(proposals.map(p => p.id === id ? { ...p, status: 'approved' as const } : p));
    }
  };

  const rejectProposal = (id: string) => {
    setProposals(proposals.map(p => p.id === id ? { ...p, status: 'rejected' as const } : p));
  };

  const getAlignmentColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      critical: 'destructive',
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    };
    return colors[severity as keyof typeof colors] || 'outline';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            <SparklesIcon className="inline h-10 w-10 text-primary mr-2" />
            UPLim Evolution Engine
          </h1>
          <p className="text-lg text-muted-foreground text-balance">
            AI-powered system for automatic language development while preserving UPLim ideology
          </p>
        </div>

        {/* Generation Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate Evolution Proposal</CardTitle>
            <CardDescription>
              Describe what you want to add or improve in UPLim. The AI will generate a proposal that aligns with the language ideology.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Example: Add support for async/await operations with simple syntax&#10;Example: Create a built-in HTTP client that's safe and easy to use&#10;Example: Improve error handling with better messages"
              className="min-h-[120px]"
            />
            {error && (
              <div className="text-sm text-destructive flex items-center gap-2">
                <AlertCircleIcon className="h-4 w-4" />
                {error}
              </div>
            )}
            <Button onClick={generateProposal} disabled={isGenerating} className="gap-2">
              <SparklesIcon className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Proposal'}
            </Button>
          </CardContent>
        </Card>

        {/* Proposals List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Evolution Proposals</h2>
          
          {proposals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No proposals yet. Generate your first proposal above!
              </CardContent>
            </Card>
          ) : (
            proposals.map((proposal) => (
              <Card key={proposal.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{proposal.type}</Badge>
                        <Badge
                          variant={proposal.status === 'approved' ? 'default' : proposal.status === 'rejected' ? 'destructive' : 'secondary'}
                        >
                          {proposal.status}
                        </Badge>
                        <span className={`text-sm font-semibold ${getAlignmentColor(proposal.ideologyAlignment)}`}>
                          {proposal.ideologyAlignment}% aligned
                        </span>
                      </div>
                      <CardTitle className="text-xl">{proposal.title}</CardTitle>
                      <CardDescription className="mt-2">{proposal.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Rationale</h4>
                    <p className="text-sm text-muted-foreground">{proposal.rationale}</p>
                  </div>

                  {proposal.examples.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Examples</h4>
                      <div className="space-y-2">
                        {proposal.examples.map((example, idx) => (
                          <div key={idx} className="rounded-md bg-muted p-3 font-mono text-sm">
                            {example}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {proposal.violations.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <AlertCircleIcon className="h-4 w-4 text-destructive" />
                        Ideology Violations
                      </h4>
                      <div className="space-y-2">
                        {proposal.violations.map((violation, idx) => (
                          <div key={idx} className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getSeverityBadge(violation.severity) as any}>
                                {violation.severity}
                              </Badge>
                              <Badge variant="outline">{violation.type}</Badge>
                            </div>
                            <p className="text-sm mb-2">{violation.message}</p>
                            <p className="text-sm text-muted-foreground">
                              💡 {violation.suggestion}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {proposal.status === 'pending' && (
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => approveProposal(proposal.id)}
                        disabled={proposal.violations.some(v => v.severity === 'critical')}
                        className="gap-2"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => rejectProposal(proposal.id)}
                        variant="destructive"
                        className="gap-2"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
