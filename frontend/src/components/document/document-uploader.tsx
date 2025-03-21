'use client';

import { useState } from 'react';

import { FileText, Loader2, Upload, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { clientLogger } from '@/lib/logger';

export function DocumentUploader() {
  const [files, setFiles] = useState<File[]>([]);
  const [instructions, setInstructions] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    onDrop: (acceptedFiles) => {
      setFiles((prev) => [...prev, ...acceptedFiles]);
    },
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    if (!instructions.trim()) {
      toast.error('Please provide analysis instructions');
      return;
    }

    setIsUploading(true);

    try {
      // In a real app, this would be an API call to upload files and start analysis
      // For now, we'll simulate a successful upload
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success('Analysis started successfully');
      setFiles([]);
      setInstructions('');
    } catch (error) {
      clientLogger.error('Failed to upload documents', { error });
      toast.error('Failed to upload documents');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div>
        <Label htmlFor='instructions'>Analysis Instructions</Label>
        <Textarea
          id='instructions'
          placeholder='Describe what you want to analyze in these documents...'
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className='mt-1.5'
          rows={3}
          required
        />
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
        }`}
      >
        <input {...getInputProps()} />
        <div className='flex flex-col items-center justify-center gap-2'>
          <Upload className='h-8 w-8 text-muted-foreground' />
          <p className='text-sm font-medium'>
            {isDragActive ? 'Drop files here' : 'Drag & drop files here, or click to select'}
          </p>
          <p className='text-xs text-muted-foreground'>
            Supports PDF, TXT, CSV, XLSX, and DOCX files
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className='space-y-2'>
          <Label>Selected Files</Label>
          <div className='max-h-40 overflow-y-auto space-y-2 rounded-lg border p-2'>
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className='flex items-center justify-between rounded-md bg-muted/50 p-2 text-sm'
              >
                <div className='flex items-center gap-2 truncate'>
                  <FileText className='h-4 w-4 flex-shrink-0' />
                  <span className='truncate'>{file.name}</span>
                  <span className='text-xs text-muted-foreground'>
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  onClick={() => removeFile(index)}
                >
                  <X className='h-4 w-4' />
                  <span className='sr-only'>Remove file</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button type='submit' disabled={isUploading || files.length === 0 || !instructions.trim()}>
        {isUploading ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Uploading...
          </>
        ) : (
          'Start Analysis'
        )}
      </Button>
    </form>
  );
}
