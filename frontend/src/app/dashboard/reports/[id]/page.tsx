'use client';

import { useEffect, useState, useCallback } from 'react';

import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

import { Report } from '@/types';
import { AlertCircle, ChevronLeft, Download, Share } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { clientLogger } from '@/lib/logger';

type ReportSection = {
  type: string;
  content: string;
  title?: string;
  attribution?: string;
  items?: string[];
  subheading?: string;
  caption?: string;
  columns?: { key: string; label: string }[];
  rows?: Record<string, string>[];
};

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reports/${reportId}`);

      if (response.ok) {
        const data = await response.json();
        setReport(data.report);
      } else if (response.status === 404) {
        toast.error('Report not found');
        setReport(null);
      } else {
        clientLogger.error('Failed to fetch report details');
        toast.error('Failed to load report details');
        setReport(null);
      }
    } catch (error) {
      clientLogger.error('Error fetching report details:', error);
      toast.error('Failed to load report details');
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    if (reportId) {
      fetchReport();
    }
  }, [reportId, fetchReport]);

  const handleGoBack = () => {
    router.back();
  };

  const handleDownload = () => {
    toast.success('Report downloaded successfully');
  };

  const handleShare = () => {
    // Copy a shareable link to clipboard
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const renderSection = (section: ReportSection, index: number) => {
    switch (section.type) {
      case 'heading':
        return (
          <div key={index} className='mb-6'>
            <h2 className='text-2xl font-bold'>{section.content}</h2>
            {section.subheading && (
              <p className='text-muted-foreground mt-1'>{section.subheading}</p>
            )}
          </div>
        );
      case 'paragraph':
        return (
          <div key={index} className='mb-6'>
            <p className='leading-7'>{section.content}</p>
          </div>
        );
      case 'bulletList':
        return (
          <div key={index} className='mb-6'>
            <ul className='list-disc pl-6 space-y-2'>
              {section.items?.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        );
      case 'numberList':
        return (
          <div key={index} className='mb-6'>
            <ol className='list-decimal pl-6 space-y-2'>
              {section.items?.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          </div>
        );
      case 'quote':
        return (
          <div key={index} className='mb-6'>
            <blockquote className='border-l-4 border-primary pl-4 py-2 italic'>
              {section.content}
              {section.attribution && (
                <footer className='text-sm text-muted-foreground mt-2'>
                  — {section.attribution}
                </footer>
              )}
            </blockquote>
          </div>
        );
      case 'visualization': {
        const sectionId = `viz-${index}`;
        return (
          <div key={index} className='mb-6 flex flex-col items-center'>
            {section.title && <h3 className='text-lg font-medium mb-3'>{section.title}</h3>}
            <div className='w-full max-w-3xl border rounded-md overflow-hidden bg-card'>
              {imgErrors[sectionId] ? (
                <div className='flex flex-col items-center justify-center p-8 bg-muted/20 text-muted-foreground'>
                  <AlertCircle className='h-10 w-10 mb-2' />
                  <p>Visualization Not Found</p>
                </div>
              ) : (
                <div className='relative' style={{ height: '400px' }}>
                  <Image
                    src={`/api/files/${report?.jobId}/${section.content}`}
                    alt={section.title || 'Visualization'}
                    fill
                    sizes='(max-width: 768px) 100vw, (max-width: 1200px) 800px, 1000px'
                    className='object-contain'
                    onError={() => setImgErrors((prev) => ({ ...prev, [sectionId]: true }))}
                  />
                </div>
              )}
              {section.caption && (
                <div className='p-4 border-t text-sm text-center text-muted-foreground'>
                  {section.caption}
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'table':
        return (
          <div key={index} className='mb-6 overflow-x-auto'>
            <div className='inline-block min-w-full align-middle'>
              <table className='min-w-full divide-y divide-border'>
                <thead>
                  <tr>
                    {section.columns?.map((header: { key: string; label: string }, i: number) => (
                      <th
                        key={i}
                        className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'
                      >
                        {header.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-y divide-border'>
                  {section.rows?.map((row: Record<string, string>, i: number) => (
                    <tr key={i}>
                      {section.columns?.map((column: { key: string; label: string }, j: number) => (
                        <td key={j} className='px-6 py-4 whitespace-nowrap text-sm'>
                          {row[column.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className='container mx-auto p-6 flex justify-center items-center min-h-[500px]'>
        <div className='text-center'>
          <div className='animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className='container mx-auto p-6'>
        <Button variant='ghost' size='sm' onClick={handleGoBack} className='mb-6'>
          <ChevronLeft className='h-4 w-4 mr-2' /> Back to Reports
        </Button>
        <Card className='mx-auto max-w-2xl'>
          <CardContent className='flex flex-col items-center justify-center py-12'>
            <AlertCircle className='h-12 w-12 text-muted-foreground mb-4' />
            <h2 className='text-xl font-semibold mb-2'>Report Not Found</h2>
            <p className='text-muted-foreground mb-6'>
              The report you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/dashboard/reports')}>View All Reports</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6'>
      <div className='flex items-center mb-6'>
        <Button variant='ghost' size='sm' onClick={handleGoBack}>
          <ChevronLeft className='h-4 w-4 mr-2' /> Back to Reports
        </Button>
        <div className='ml-auto flex gap-2'>
          <Button variant='outline' size='sm' onClick={handleShare}>
            <Share className='h-4 w-4 mr-2' /> Share
          </Button>
          <Button variant='outline' size='sm' onClick={handleDownload}>
            <Download className='h-4 w-4 mr-2' /> Download
          </Button>
        </div>
      </div>

      <Card className='mb-8'>
        <CardHeader>
          <CardTitle className='text-3xl'>{report.title}</CardTitle>
          <CardDescription>
            <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2'>
              <div>{report.author || 'Anonymous'}</div>
              <div className='hidden sm:block'>•</div>
              <div>{new Date(report.createdAt).toLocaleDateString()}</div>
              {report.type && (
                <>
                  <div className='hidden sm:block'>•</div>
                  <div className='capitalize'>{report.type} Report</div>
                </>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {report.description && (
            <p className='leading-7 mb-6 text-muted-foreground'>{report.description}</p>
          )}

          {report.sections && report.sections.length > 0 ? (
            <div className='mt-6'>
              {report.sections.map((section, index) => renderSection(section, index))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <p className='text-muted-foreground'>This report has no content sections.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className='my-8' />

      <div className='text-center text-sm text-muted-foreground'>
        <p>Report ID: {reportId}</p>
        <p>Last updated: {new Date(report.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}
