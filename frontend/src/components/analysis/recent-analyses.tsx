"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { FileText, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AnalysisJob, AnalysisStatus } from '@/types/analysis';
import { clientLogger } from '@/lib/logger';

// Status icon mapping
const StatusIcon = ({ status }: { status: AnalysisStatus }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case 'queued':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'cancelled':
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export function RecentAnalyses() {
  const [analyses, setAnalyses] = useState<AnalysisJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentAnalyses = async () => {
      try {
        // In a real app, this would be an API call
        // For now, we'll use mock data
        const mockData: AnalysisJob[] = [
          {
            job_id: '1',
            status: 'completed',
            progress: 100,
            started_at: new Date(Date.now() - 3600000).toISOString(),
            completed_at: new Date().toISOString(),
            messages: [],
            result: {
              summary: 'Analysis of financial data completed',
              files: ['financial_report.pdf'],
              completion_time: '5 minutes',
            },
          },
          {
            job_id: '2',
            status: 'running',
            progress: 65,
            started_at: new Date(Date.now() - 1800000).toISOString(),
            messages: [],
            current_agent: 'data-processor',
          },
          {
            job_id: '3',
            status: 'queued',
            progress: 0,
            started_at: new Date(Date.now() - 600000).toISOString(),
            messages: [],
          },
        ];

        setAnalyses(mockData);
        setLoading(false);
      } catch (error) {
        clientLogger.error('Failed to fetch recent analyses', { error });
        toast.error('Failed to load recent analyses');
        setLoading(false);
      }
    };

    fetchRecentAnalyses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FileText className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No recent analyses found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {analyses.map((analysis) => (
        <div
          key={analysis.job_id}
          className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <StatusIcon status={analysis.status} />
            <div>
              <p className="font-medium">
                Analysis #{analysis.job_id}
                {analysis.result?.summary ? `: ${analysis.result.summary.substring(0, 30)}...` : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                Started: {format(new Date(analysis.started_at), 'MMM d, h:mm a')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {analysis.status === 'running' && (
              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${analysis.progress}%` }}
                />
              </div>
            )}
            <span className="text-xs font-medium capitalize">{analysis.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
} 