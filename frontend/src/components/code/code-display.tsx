'use client';

import { useState } from 'react';

import { Check, Copy } from 'lucide-react';
// Dynamically import SyntaxHighlighter to avoid SSR issues
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
// Common languages
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { clientLogger } from '@/lib/logger';

// Register languages
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('sql', sql);

interface CodeDisplayProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeDisplay({
  code,
  language = 'text',
  showLineNumbers = true,
  className = '',
}: CodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard');

      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      clientLogger.error('Failed to copy code to clipboard', { error });
      toast.error('Failed to copy code');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className='absolute right-2 top-2 z-10'>
        <Button
          variant='ghost'
          size='icon'
          onClick={copyToClipboard}
          className='h-8 w-8 rounded-md bg-background/80 hover:bg-background/90 backdrop-blur'
        >
          {copied ? <Check className='h-4 w-4 text-green-500' /> : <Copy className='h-4 w-4' />}
          <span className='sr-only'>Copy code</span>
        </Button>
      </div>

      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers={showLineNumbers}
        wrapLongLines={true}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
