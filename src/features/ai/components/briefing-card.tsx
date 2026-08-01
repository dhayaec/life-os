'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type BriefingSnapshot = {
  agenda: { title: string; startAt: string }[];
  tasksDue: { title: string; dueAt: string | null }[];
  habits: { name: string; streak: number }[];
  recentNotes: { title: string; updatedAt: string }[];
  finance?: { balance: number; expense: number } | null;
};

export function BriefingCard({ snapshot }: { snapshot: BriefingSnapshot }) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(snapshot),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        setError(json?.error ?? 'Something went wrong');
        return;
      }
      setBriefing(json.data.briefing as string);
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4" />
          AI Briefing
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {briefing ? (
          <p className="text-muted-foreground whitespace-pre-wrap text-sm">{briefing}</p>
        ) : (
          <>
            {error ? (
              <p className="text-muted-foreground text-xs">{error}</p>
            ) : (
              <p className="text-muted-foreground text-xs">
                Have AI summarize your day. Requires AI_GATEWAY_API_KEY.
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-fit"
              onClick={generate}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {loading ? 'Generating…' : 'Generate briefing'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
