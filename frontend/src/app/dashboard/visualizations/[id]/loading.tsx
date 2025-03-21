import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function VisualizationDetailLoading() {
  return (
    <div className='container mx-auto p-6'>
      <Button variant='ghost' size='sm' className='mb-6' disabled>
        <ArrowLeft className='h-4 w-4 mr-2' />
        Back to Visualizations
      </Button>

      <div className='flex flex-col md:flex-row justify-between items-start mb-6'>
        <div>
          <Skeleton className='h-8 w-64 mb-2' />
          <Skeleton className='h-4 w-48' />
        </div>

        <div className='flex gap-2 mt-4 md:mt-0'>
          <Skeleton className='h-9 w-24' />
          <Skeleton className='h-9 w-32' />
          <Skeleton className='h-9 w-32' />
        </div>
      </div>

      <Skeleton className='h-10 w-full max-w-md mb-6' />

      <Card className='overflow-hidden mb-6'>
        <div className='flex justify-center p-6 bg-muted/20'>
          <Skeleton className='h-[400px] w-full max-w-3xl' />
        </div>
        <CardContent className='pt-6'>
          <Skeleton className='h-4 w-full mb-2' />
          <Skeleton className='h-4 w-5/6 mb-2' />
          <Skeleton className='h-4 w-4/6' />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-48 mb-2' />
          <Skeleton className='h-4 w-64' />
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-4'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className='h-4 w-24 mb-1' />
                  <Skeleton className='h-4 w-48' />
                </div>
              ))}
            </div>

            <div className='space-y-4'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className='h-4 w-24 mb-1' />
                  <Skeleton className='h-4 w-48' />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
