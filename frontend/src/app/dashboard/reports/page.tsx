'use client';

import { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Report } from '@/types';
import { Filter, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { clientLogger } from '@/lib/logger';

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const filterReports = useCallback(() => {
    let filtered = [...reports];

    // Filter by type
    if (activeTab !== 'all') {
      filtered = filtered.filter((report) => report.type === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.title.toLowerCase().includes(term) ||
          report.description?.toLowerCase().includes(term) ||
          false ||
          report.author?.toLowerCase().includes(term) ||
          false
      );
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, activeTab]);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [filterReports]);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/reports');

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        setFilteredReports(data.reports || []);
      } else {
        clientLogger.error('Failed to fetch reports');
        toast.error('Failed to load reports');
        setReports([]);
        setFilteredReports([]);
      }
    } catch (error) {
      clientLogger.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
      setReports([]);
      setFilteredReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewReport = (id: string) => {
    router.push(`/dashboard/reports/${id}`);
  };

  const handleCreateReport = () => {
    router.push('/dashboard/reports/create');
  };

  return (
    <div className='container mx-auto p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>Reports</h1>
          <p className='text-muted-foreground'>View and manage your analysis reports</p>
        </div>
        <Button onClick={handleCreateReport}>
          <Plus className='mr-2 h-4 w-4' /> Create Report
        </Button>
      </div>

      <div className='flex flex-col sm:flex-row gap-4 mb-6'>
        <div className='relative flex-1'>
          <Input
            placeholder='Search reports...'
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
                <span className='sr-only'>Filter reports</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={() => setActiveTab('all')}>All Reports</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('analysis')}>
                Analysis Reports
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('summary')}>
                Summary Reports
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('custom')}>
                Custom Reports
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='mb-6'>
        <TabsList className='grid grid-cols-4 max-w-md'>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='analysis'>Analysis</TabsTrigger>
          <TabsTrigger value='summary'>Summary</TabsTrigger>
          <TabsTrigger value='custom'>Custom</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className='flex justify-center items-center min-h-[500px]'>
          <div className='text-center'>
            <div className='animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4'></div>
            <p className='text-muted-foreground'>Loading reports...</p>
          </div>
        </div>
      ) : filteredReports.length === 0 ? (
        <Card>
          <CardContent className='flex justify-center items-center min-h-[400px]'>
            <div className='text-center'>
              <p className='text-lg font-medium mb-2'>No Reports Found</p>
              <p className='text-muted-foreground mb-4'>
                {searchTerm
                  ? `No reports match your search for "${searchTerm}"`
                  : activeTab !== 'all'
                    ? `No ${activeTab} reports available`
                    : 'No reports have been created yet'}
              </p>
              <Button onClick={handleCreateReport}>Create New Report</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredReports.map((report) => (
            <Card
              key={report.id}
              className='cursor-pointer hover:shadow-md transition-shadow'
              onClick={() => handleViewReport(report.id)}
            >
              <CardHeader>
                <CardTitle className='line-clamp-2'>{report.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground line-clamp-3'>
                  {report.description || 'No description provided'}
                </p>
              </CardContent>
              <CardFooter className='flex justify-between text-sm text-muted-foreground'>
                <div>By {report.author || 'Anonymous'}</div>
                <div>{new Date(report.createdAt).toLocaleDateString()}</div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
