'use client';

import { useEffect, useState, useCallback } from 'react';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

import { Analysis } from '@/types';
import { AlertCircle, ChevronLeft, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { CodeDisplay } from '@/components/code/code-display';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { clientLogger } from '@/lib/logger';

import { useAnalysisRealTime } from '@/hooks/use-analysis-real-time';

export default function AnalysisDetailPage() {
  const router = useRouter();
  const params = useParams();
  const analysisId = params.id as string;

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const { status, progress, logs } = useAnalysisRealTime(analysisId);

  const fetchAnalysis = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analysis/${analysisId}`);

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      } else if (response.status === 404) {
        toast.error('Analysis not found');
        setAnalysis(null);
      } else {
        clientLogger.error('Failed to fetch analysis details');
        toast.error('Failed to load analysis details');
        setAnalysis(null);
      }
    } catch (error) {
      clientLogger.error('Error fetching analysis details:', error);
      toast.error('Failed to load analysis details');
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    if (analysisId) {
      fetchAnalysis();
    }
  }, [analysisId, fetchAnalysis]);

  const handleGoBack = () => {
    router.back();
  };

  const handleCreateReport = () => {
    if (analysis) {
      router.push(`/dashboard/reports/create?analysisId=${analysis.id}`);
    }
  };

  const getStatusBadge = () => {
    const statusMap: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      pending: { label: 'Pending', variant: 'secondary' },
      running: { label: 'Running', variant: 'default' },
      completed: { label: 'Completed', variant: 'default' },
      failed: { label: 'Failed', variant: 'destructive' },
      cancelled: { label: 'Cancelled', variant: 'outline' },
    };

    const currentStatus = status || analysis?.status || 'pending';
    const badgeInfo = statusMap[currentStatus] || statusMap.pending;

    return <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className='container mx-auto p-6 flex justify-center items-center min-h-[500px]'>
        <div className='text-center'>
          <div className='animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className='container mx-auto p-6'>
        <Button variant='ghost' size='sm' onClick={handleGoBack} className='mb-6'>
          <ChevronLeft className='h-4 w-4 mr-2' /> Back to Analyses
        </Button>
        <Card className='mx-auto max-w-2xl'>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <AlertCircle className='h-12 w-12 text-muted-foreground mb-4' />
            <h2 className='text-xl font-semibold mb-2'>Analysis Not Found</h2>
            <p className='text-muted-foreground mb-6'>
              The analysis you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/dashboard/analysis')}>View All Analyses</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6'>
      <div className='flex items-center mb-6'>
        <Button variant='ghost' size='sm' onClick={handleGoBack}>
          <ChevronLeft className='h-4 w-4 mr-2' /> Back to Analyses
        </Button>
        <div className='ml-auto flex gap-2'>
          <Button onClick={handleCreateReport} disabled={analysis.status !== 'completed'}>
            <FileText className='h-4 w-4 mr-2' /> Create Report
          </Button>
        </div>
      </div>

      <Card className='mb-6'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-2xl'>{analysis.title}</CardTitle>
            {getStatusBadge()}
          </div>
          <CardDescription>
            <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2'>
              <div className='flex items-center'>
                <Clock className='h-4 w-4 mr-1 text-muted-foreground' />
                <span>{new Date(analysis.createdAt).toLocaleString()}</span>
              </div>
              <div className='hidden sm:block text-muted-foreground'>•</div>
              <div className='capitalize'>{analysis.type} Analysis</div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground mb-4'>
            {analysis.description || 'No description provided'}
          </p>

          {status === 'running' && (
            <div className='mb-4'>
              <div className='flex justify-between text-sm mb-1'>
                <span>Analysis in progress...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className='h-2' />
            </div>
          )}

          <div className='flex flex-wrap gap-2 mt-4'>
            {analysis.tags &&
              analysis.tags.map((tag, index) => (
                <Badge key={index} variant='secondary'>
                  {tag}
                </Badge>
              ))}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='mb-4'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='visualizations'>Visualizations</TabsTrigger>
          <TabsTrigger value='results'>Results</TabsTrigger>
          <TabsTrigger value='logs'>Logs</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 md:grid-cols-3'>
                <div>
                  <h3 className='font-medium'>Data Sources</h3>
                  <ul className='mt-2 space-y-1 text-sm text-muted-foreground'>
                    {analysis.dataSources?.map((source, index) => (
                      <li key={index}>{source}</li>
                    )) || <li>No data sources specified</li>}
                  </ul>
                </div>

                <div>
                  <h3 className='font-medium'>Parameters</h3>
                  <ul className='mt-2 space-y-1 text-sm text-muted-foreground'>
                    {(analysis.parameters &&
                      Object.entries(analysis.parameters).map(([key, value], index) => (
                        <li key={index}>
                          <strong>{key}:</strong> {value?.toString()}
                        </li>
                      ))) || <li>No parameters specified</li>}
                  </ul>
                </div>

                <div>
                  <h3 className='font-medium'>Stats</h3>
                  <ul className='mt-2 space-y-1 text-sm text-muted-foreground'>
                    <li>
                      <strong>Started:</strong> {new Date(analysis.createdAt).toLocaleString()}
                    </li>
                    {analysis.completedAt && (
                      <li>
                        <strong>Completed:</strong>{' '}
                        {new Date(analysis.completedAt).toLocaleString()}
                      </li>
                    )}
                    <li>
                      <strong>Duration:</strong> {analysis.duration || 'N/A'}
                    </li>
                    <li>
                      <strong>Data Points:</strong> {analysis.dataPoints?.toLocaleString() || 'N/A'}
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {analysis.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Key Findings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='prose max-w-none dark:prose-invert'>
                  <p>{analysis.summary}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='visualizations' className='space-y-4'>
          {analysis.visualizations && analysis.visualizations.length > 0 ? (
            <div className='grid gap-6 md:grid-cols-2'>
              {analysis.visualizations.map((visualization, index) => {
                const vizId = `viz-${index}`;
                return (
                  <Card key={index} className='overflow-hidden'>
                    <CardHeader className='p-4'>
                      <CardTitle className='text-lg'>{visualization.title}</CardTitle>
                    </CardHeader>
                    <div className='relative aspect-video bg-muted/10'>
                      {imgErrors[vizId] ? (
                        <div className='flex flex-col items-center justify-center h-full p-8 bg-muted/20 text-muted-foreground'>
                          <AlertCircle className='h-10 w-10 mb-2' />
                          <p>Visualization Not Found</p>
                        </div>
                      ) : (
                        <div className='relative w-full h-full'>
                          <Image
                            src={`/api/files/${analysis.jobId}/${visualization.filePath}`}
                            alt={visualization.title}
                            fill
                            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                            className='object-contain'
                            onError={() => setImgErrors((prev) => ({ ...prev, [vizId]: true }))}
                          />
                        </div>
                      )}
                    </div>
                    <CardFooter className='p-4 bg-muted/10'>
                      <p className='text-sm text-muted-foreground'>
                        {visualization.description || 'No description available'}
                      </p>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className='flex justify-center items-center py-12'>
                <div className='text-center'>
                  <p className='text-lg font-medium mb-2'>No Visualizations</p>
                  <p className='text-muted-foreground'>
                    {analysis.status === 'completed'
                      ? 'This analysis did not generate any visualizations.'
                      : 'Visualizations will appear here once the analysis is complete.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='results' className='space-y-4'>
          {analysis.results && Object.keys(analysis.results).length > 0 ? (
            <div className='space-y-4'>
              {Object.entries(analysis.results).map(([key, value], index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className='capitalize'>{key.replace('_', ' ')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {typeof value === 'object' ? (
                      <CodeDisplay code={JSON.stringify(value, null, 2)} language='json' />
                    ) : (
                      <p className='whitespace-pre-wrap font-mono text-sm'>{value?.toString()}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className='flex justify-center items-center py-12'>
                <div className='text-center'>
                  <p className='text-lg font-medium mb-2'>No Results</p>
                  <p className='text-muted-foreground'>
                    {analysis.status === 'completed'
                      ? 'This analysis did not generate any results data.'
                      : 'Results will appear here once the analysis is complete.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='logs'>
          <Card>
            <CardHeader>
              <CardTitle>Analysis Logs</CardTitle>
              <CardDescription>Real-time log output from the analysis process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='bg-muted/50 p-4 rounded-md max-h-[400px] overflow-y-auto'>
                <pre className='text-xs font-mono whitespace-pre-wrap'>
                  {logs?.length > 0 ? logs.join('\n') : 'No logs available'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator className='my-8' />

      <div className='text-center text-sm text-muted-foreground'>
        <p>Analysis ID: {analysisId}</p>
        <p>Job ID: {analysis.jobId || 'Not assigned'}</p>
      </div>
    </div>
  );
}
