'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

import { Visualization } from '@/types';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { clientLogger } from '@/lib/logger';

export default function VisualizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [visualization, setVisualization] = useState<Visualization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('preview');
  const visualizationId = params.id as string;
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);

  useEffect(() => {
    const fetchVisualization = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/visualizations/${visualizationId}`);

        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        setVisualization(data.visualization);
      } catch (error) {
        clientLogger.error('Failed to fetch visualization', { error, visualizationId });
        toast.error('Failed to load visualization details');
        setVisualization(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (visualizationId) {
      fetchVisualization();
    }
  }, [visualizationId]);

  const handleDownload = () => {
    if (!visualization) return;

    try {
      // Download the visualization image
      window.open(`/api/files/${visualization.jobId}/${visualization.filePath}`, '_blank');
      toast.success('Visualization downloaded successfully');
    } catch (error) {
      clientLogger.error('Failed to download visualization', { error });
      toast.error('Failed to download visualization');
    }
  };

  const handleShare = () => {
    if (!visualization) return;

    // In a real implementation, this would generate a shareable link
    // For now, we'll just copy the current URL to clipboard
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => toast.success('Link copied to clipboard'))
      .catch((error) => {
        clientLogger.error('Failed to copy link', { error });
        toast.error('Failed to copy link');
      });
  };

  const goBack = () => {
    router.back();
  };

  const handleImageError = () => {
    setFallbackSrc('https://via.placeholder.com/800x400?text=Visualization+Not+Found');
  };

  if (isLoading) {
    return (
      <div className='container mx-auto p-6'>
        <Button variant='ghost' size='sm' className='mb-6' onClick={goBack}>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Visualizations
        </Button>

        <div className='flex justify-center items-center min-h-[500px]'>
          <div className='text-center'>
            <div className='animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4'></div>
            <p className='text-muted-foreground'>Loading visualization...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!visualization) {
    return (
      <div className='container mx-auto p-6'>
        <Button variant='ghost' size='sm' className='mb-6' onClick={goBack}>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Visualizations
        </Button>

        <Card>
          <CardContent className='flex justify-center items-center min-h-[500px]'>
            <div className='text-center'>
              <p className='text-lg font-medium mb-2'>Visualization Not Found</p>
              <p className='text-muted-foreground mb-4'>
                The visualization you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <Button onClick={() => router.push('/dashboard/visualizations')}>
                View All Visualizations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6'>
      <Button variant='ghost' size='sm' className='mb-6' onClick={goBack}>
        <ArrowLeft className='h-4 w-4 mr-2' />
        Back to Visualizations
      </Button>

      <div className='flex flex-col md:flex-row justify-between items-start mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>{visualization.title}</h1>
          <p className='text-muted-foreground'>
            Created on {new Date(visualization.createdAt).toLocaleString()}
          </p>
        </div>

        <div className='flex gap-2 mt-4 md:mt-0'>
          <Button variant='outline' size='sm' onClick={handleShare}>
            <Share2 className='h-4 w-4 mr-2' />
            Share
          </Button>
          <Button variant='outline' size='sm' onClick={handleDownload}>
            <Download className='h-4 w-4 mr-2' />
            Download
          </Button>
          <Button
            variant='default'
            size='sm'
            onClick={() => router.push(`/dashboard/analysis/${visualization.jobId}`)}
          >
            View Analysis
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue='preview'
        value={activeTab}
        onValueChange={setActiveTab}
        className='w-full mb-6'
      >
        <TabsList>
          <TabsTrigger value='preview'>Preview</TabsTrigger>
          <TabsTrigger value='details'>Details</TabsTrigger>
          <TabsTrigger value='related'>Related</TabsTrigger>
        </TabsList>

        <TabsContent value='preview' className='mt-6'>
          <Card className='overflow-hidden'>
            <div className='flex justify-center p-6 bg-muted/20'>
              {fallbackSrc ? (
                // Use Next.js Image for fallback
                <div className="relative w-full max-h-[600px] flex justify-center">
                  <Image
                    src={fallbackSrc}
                    alt={visualization.title || "Visualization"}
                    width={800}
                    height={600}
                    className='max-w-full object-contain'
                  />
                </div>
              ) : (
                <div className='relative w-full aspect-video flex items-center justify-center'>
                  <Image
                    src={`/api/files/${visualization.jobId}/${visualization.filePath}`}
                    alt={visualization.title}
                    fill
                    sizes='(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 50vw'
                    className='object-contain'
                    priority
                    onError={handleImageError}
                  />
                </div>
              )}
            </div>
            <CardContent className='pt-6'>
              <p className='text-muted-foreground'>
                {visualization.description || 'No description available'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='details' className='mt-6'>
          <Card>
            <CardHeader>
              <CardTitle>Visualization Details</CardTitle>
              <CardDescription>Technical information about this visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <div>
                    <p className='text-sm font-medium'>Type</p>
                    <p className='text-sm text-muted-foreground capitalize'>{visualization.type}</p>
                  </div>
                  <div>
                    <p className='text-sm font-medium'>Created</p>
                    <p className='text-sm text-muted-foreground'>
                      {new Date(visualization.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className='text-sm font-medium'>Analysis Job</p>
                    <p className='text-sm text-muted-foreground'>
                      <Button
                        variant='link'
                        className='p-0 h-auto'
                        onClick={() => router.push(`/dashboard/analysis/${visualization.jobId}`)}
                      >
                        {visualization.jobId}
                      </Button>
                    </p>
                  </div>
                </div>
                {visualization.tags && visualization.tags.length > 0 && (
                  <div className='space-y-2'>
                    <div>
                      <p className='text-sm font-medium'>Tags</p>
                      <div className='flex flex-wrap gap-1.5 mt-1'>
                        {visualization.tags.map((tag, index) => (
                          <span key={index} className='px-2 py-1 bg-muted text-xs rounded-full'>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='related' className='mt-6'>
          <Card>
            <CardHeader>
              <CardTitle>Related Visualizations</CardTitle>
              <CardDescription>Other visualizations from the same analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8'>
                <p className='text-muted-foreground'>Loading related visualizations...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
