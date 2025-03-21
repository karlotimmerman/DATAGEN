'use client';

import { useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import { Visualization } from '@/types';
import { Filter, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { clientLogger } from '@/lib/logger';

export default function VisualizationsPage() {
  const router = useRouter();
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [filteredVisualizations, setFilteredVisualizations] = useState<Visualization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const filterVisualizations = useCallback(() => {
    let filtered = [...visualizations];

    // Filter by type
    if (activeTab !== 'all') {
      filtered = filtered.filter((visualization) => visualization.type === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (visualization) =>
          visualization.title.toLowerCase().includes(term) ||
          visualization.description?.toLowerCase().includes(term) ||
          false ||
          visualization.tags?.some((tag) => tag.toLowerCase().includes(term)) ||
          false
      );
    }

    setFilteredVisualizations(filtered);
  }, [visualizations, searchTerm, activeTab]);

  useEffect(() => {
    fetchVisualizations();
  }, []);

  useEffect(() => {
    filterVisualizations();
  }, [filterVisualizations]);

  const fetchVisualizations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/visualizations');

      if (response.ok) {
        const data = await response.json();
        setVisualizations(data.visualizations || []);
        setFilteredVisualizations(data.visualizations || []);
      } else {
        clientLogger.error('Failed to fetch visualizations');
        toast.error('Failed to load visualizations');
        setVisualizations([]);
        setFilteredVisualizations([]);
      }
    } catch (_) {
      clientLogger.error('Error fetching visualizations');
      toast.error('Failed to load visualizations');
      setVisualizations([]);
      setFilteredVisualizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewVisualization = (id: string) => {
    router.push(`/dashboard/visualizations/${id}`);
  };

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className='container mx-auto p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>Visualizations</h1>
          <p className='text-muted-foreground'>
            View and analyze data visualizations from your analyses
          </p>
        </div>
      </div>

      <div className='flex flex-col sm:flex-row gap-4 mb-6'>
        <div className='relative flex-1'>
          <Input
            placeholder='Search visualizations...'
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className='pl-10'
          />
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
        </div>
        <div className='flex gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon'>
                <Filter className='h-4 w-4' />
                <span className='sr-only'>Filter visualizations</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => setActiveTab('all')}>All Types</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('chart')}>Charts</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('graph')}>Graphs</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('plot')}>Plots</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('image')}>Images</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='mb-6'>
        <TabsList className='grid grid-cols-5 max-w-lg'>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='chart'>Charts</TabsTrigger>
          <TabsTrigger value='graph'>Graphs</TabsTrigger>
          <TabsTrigger value='plot'>Plots</TabsTrigger>
          <TabsTrigger value='image'>Images</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className='flex justify-center items-center min-h-[500px]'>
          <div className='text-center'>
            <div className='animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4'></div>
            <p className='text-muted-foreground'>Loading visualizations...</p>
          </div>
        </div>
      ) : filteredVisualizations.length === 0 ? (
        <Card>
          <CardContent className='flex justify-center items-center min-h-[400px]'>
            <div className='text-center'>
              <p className='text-lg font-medium mb-2'>No Visualizations Found</p>
              <p className='text-muted-foreground mb-4'>
                {searchTerm
                  ? `No visualizations match your search for "${searchTerm}"`
                  : activeTab !== 'all'
                    ? `No ${activeTab} visualizations available`
                    : 'No visualizations have been created yet'}
              </p>
              <Button onClick={() => router.push('/dashboard/analysis')}>
                Create New Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredVisualizations.map((visualization) => (
            <Card
              key={visualization.id}
              className='overflow-hidden cursor-pointer hover:shadow-md transition-shadow'
              onClick={() => handleViewVisualization(visualization.id)}
            >
              <div className='aspect-video relative bg-muted/10 flex items-center justify-center'>
                {imageErrors[visualization.id] ? (
                  <div className="relative w-full h-full">
                    <Image
                      src='https://via.placeholder.com/640x360?text=Preview+Not+Available'
                      alt={visualization.title || "Visualization preview"}
                      fill
                      className='object-contain'
                    />
                  </div>
                ) : (
                  <div className='relative w-full h-full'>
                    <Image
                      src={`/api/files/${visualization.jobId}/${visualization.filePath}`}
                      alt={visualization.title}
                      fill
                      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                      className='object-contain'
                      onError={() => handleImageError(visualization.id)}
                    />
                  </div>
                )}
              </div>
              <CardHeader className='pb-2'>
                <CardTitle className='text-lg'>{visualization.title}</CardTitle>
                <CardDescription className='line-clamp-2'>
                  {visualization.description || 'No description provided'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  Created: {new Date(visualization.createdAt).toLocaleDateString()}
                </p>
                {visualization.tags && visualization.tags.length > 0 && (
                  <div className='flex flex-wrap gap-1 mt-2'>
                    {visualization.tags.slice(0, 3).map((tag, i) => (
                      <span key={i} className='px-2 py-0.5 bg-muted text-xs rounded-full'>
                        {tag}
                      </span>
                    ))}
                    {visualization.tags.length > 3 && (
                      <span className='px-2 py-0.5 bg-muted text-xs rounded-full'>
                        +{visualization.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
