'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { CodeFile } from '@/types';
import { AlertCircle, Code, Download, FileCode2, Folder, Separator } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { clientLogger } from '@/lib/logger';

export default function CodePage() {
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchCodeFiles = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/code-files');

        if (!response.ok) {
          throw new Error(`Failed to fetch code files: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch code files');
        }

        setCodeFiles(data.data);

        if (data.data.length > 0) {
          setSelectedFile(data.data[0].id);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        clientLogger.error('Failed to fetch code files', { error: errorMessage });
        setError(errorMessage);
        toast.error('Failed to load code files');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCodeFiles();
  }, []);

  const getSelectedFileContent = () => {
    if (!selectedFile) return null;
    return codeFiles.find((file) => file.id === selectedFile);
  };

  const downloadFile = async (file: CodeFile) => {
    try {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      clientLogger.error('Failed to download file', { error: err, fileName: file.name });
      toast.error('Failed to download file');
    }
  };

  const navigateToAnalysis = (jobId: string) => {
    router.push(`/dashboard/analysis/${jobId}`);
  };

  const selectedFileData = getSelectedFileContent();

  if (isLoading) {
    return (
      <div className='container mx-auto p-6'>
        <h1 className='text-2xl font-bold mb-6'>Code Repository</h1>
        <Card>
          <CardContent className='flex justify-center items-center min-h-[400px]'>
            <div className='text-center'>
              <div className='animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4'></div>
              <p className='text-muted-foreground'>Loading code files...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto p-6'>
        <h1 className='text-2xl font-bold mb-6'>Code Repository</h1>
        <Card>
          <CardContent className='flex justify-center items-center min-h-[400px]'>
            <div className='text-center'>
              <AlertCircle className='h-12 w-12 mx-auto mb-4 text-destructive' />
              <p className='text-lg font-medium mb-2'>Error Loading Code Files</p>
              <p className='text-muted-foreground'>{error}</p>
              <Button className='mt-4' onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (codeFiles.length === 0) {
    return (
      <div className='container mx-auto p-6'>
        <h1 className='text-2xl font-bold mb-6'>Code Repository</h1>
        <Card>
          <CardContent className='flex justify-center items-center min-h-[400px]'>
            <div className='text-center'>
              <FileCode2 className='h-12 w-12 mx-auto mb-4 text-muted-foreground' />
              <p className='text-lg font-medium mb-2'>No Code Files Available</p>
              <p className='text-muted-foreground'>
                No code files have been generated yet. Run an analysis to generate code.
              </p>
              <Button className='mt-4' onClick={() => router.push('/dashboard')}>
                Run Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group files by analysis job
  const filesByJob = codeFiles.reduce(
    (acc, file) => {
      if (!acc[file.job_id]) {
        acc[file.job_id] = [];
      }
      acc[file.job_id].push(file);
      return acc;
    },
    {} as Record<string, CodeFile[]>
  );

  return (
    <div className='container mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-2'>Code Repository</h1>
      <p className='text-muted-foreground mb-6'>
        View and download code files generated from your analyses
      </p>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        <div className='lg:col-span-1'>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Files</CardTitle>
              <CardDescription>
                {codeFiles.length} files from {Object.keys(filesByJob).length} analyses
              </CardDescription>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='max-h-[600px] overflow-y-auto'>
                {Object.entries(filesByJob).map(([jobId, files]) => (
                  <div key={jobId} className='mb-2'>
                    <div className='px-4 py-2 flex items-center justify-between'>
                      <div className='flex items-center'>
                        <Folder className='h-4 w-4 mr-2 text-muted-foreground' />
                        <span className='font-medium text-sm'>
                          Analysis #{jobId.substring(0, 8)}
                        </span>
                      </div>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='h-6 px-2'
                        onClick={() => navigateToAnalysis(jobId)}
                      >
                        View
                      </Button>
                    </div>
                    <div className='pl-5'>
                      {files.map((file) => (
                        <Button
                          key={file.id}
                          variant={selectedFile === file.id ? 'secondary' : 'ghost'}
                          className='w-full justify-start text-left mb-1 py-1 h-auto'
                          onClick={() => setSelectedFile(file.id)}
                        >
                          <Code className='h-3.5 w-3.5 mr-2' />
                          <span className='truncate'>{file.name}</span>
                        </Button>
                      ))}
                    </div>
                    <Separator className='my-2' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className='lg:col-span-3'>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle>{selectedFileData ? selectedFileData.name : 'Select a file'}</CardTitle>
              {selectedFileData && (
                <CardDescription>
                  From Analysis #{selectedFileData.job_id.substring(0, 8)} • Created at{' '}
                  {new Date(selectedFileData.created_at).toLocaleString()}
                </CardDescription>
              )}
            </div>
            {selectedFileData && (
              <Button variant='outline' size='sm' onClick={() => downloadFile(selectedFileData)}>
                <Download className='h-4 w-4 mr-2' />
                Download
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {selectedFileData ? (
              <pre className='p-4 rounded-md bg-muted overflow-x-auto'>
                <code className='text-sm font-mono whitespace-pre'>{selectedFileData.content}</code>
              </pre>
            ) : (
              <div className='text-center p-8'>
                <p className='text-muted-foreground'>Select a file to view its content</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
