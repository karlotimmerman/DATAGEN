'use client';

import { useState } from 'react';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  Code,
  DollarSign,
  FileText,
  Image as ImageIcon,
  MoveDown,
  MoveUp,
  Plus,
  Save,
  Table,
  Trash2,
} from 'lucide-react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { clientLogger } from '@/lib/logger';

// Define types for report components
type ReportSectionType = 'text' | 'visualization' | 'code' | 'table' | 'financial';

type ReportSection = {
  id: string;
  title: string;
  type: ReportSectionType;
  content: string;
  order: number;
};

type ReportData = {
  title: string;
  description: string;
  type: 'it-strategy' | 'financial-analysis' | 'technical-review' | 'custom';
  tags: string[];
  sections: ReportSection[];
};

// Mock data for available visualizations, code snippets, and tables
type AssetItem = {
  id: string;
  title: string;
  description?: string;
  preview?: string;
  jobId?: string;
  type?: string;
  createdAt?: string;
};

const mockVisualizations: AssetItem[] = [
  {
    id: 'v1',
    title: 'Infrastructure Cost Comparison',
    description: 'Comparison of costs between current and projected infrastructure',
    preview: 'https://via.placeholder.com/400x200?text=Infrastructure+Cost',
    jobId: 'job123',
    type: 'chart',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v2',
    title: 'ROI Projection',
    description: 'Five-year ROI projection for IT investments',
    preview: 'https://via.placeholder.com/400x200?text=ROI+Projection',
    jobId: 'job123',
    type: 'chart',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'v3',
    title: 'Risk Assessment Matrix',
    description: 'Matrix of implementation risks and mitigation strategies',
    preview: 'https://via.placeholder.com/400x200?text=Risk+Assessment',
    jobId: 'job456',
    type: 'table',
    createdAt: new Date().toISOString(),
  },
];

const mockCodeSnippets: AssetItem[] = [
  {
    id: 'c1',
    title: 'Infrastructure Deployment Script',
    description: 'Automation script for infrastructure deployment',
    jobId: 'job123',
    type: 'bash',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    title: 'ROI Calculation Script',
    description: 'Python script for calculating return on investment',
    jobId: 'job456',
    type: 'python',
    createdAt: new Date().toISOString(),
  },
];

const mockTables: AssetItem[] = [
  {
    id: 't1',
    title: 'Cost Analysis Table',
    description: 'Breakdown of costs by investment area',
    jobId: 'job123',
    createdAt: new Date().toISOString(),
  },
  {
    id: 't2',
    title: 'Hardware Comparison Table',
    description: 'Comparison of current vs. proposed hardware specifications',
    jobId: 'job456',
    createdAt: new Date().toISOString(),
  },
];

export default function CreateReportPage() {
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData>({
    title: '',
    description: '',
    type: 'custom',
    tags: [],
    sections: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState<'visualizations' | 'code' | 'tables'>(
    'visualizations'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [sectionBeingEdited, setSectionBeingEdited] = useState<ReportSection | null>(null);
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReportData({
      ...reportData,
      title: e.target.value,
    });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReportData({
      ...reportData,
      description: e.target.value,
    });
  };

  const handleTypeChange = (value: string) => {
    setReportData({
      ...reportData,
      type: value as ReportData['type'],
    });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (!reportData.tags.includes(tagInput.trim())) {
        setReportData({
          ...reportData,
          tags: [...reportData.tags, tagInput.trim()],
        });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setReportData({
      ...reportData,
      tags: reportData.tags.filter((t) => t !== tag),
    });
  };

  const addSection = (type: ReportSectionType) => {
    const newSection: ReportSection = {
      id: `section-${Date.now()}`,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Section`,
      type,
      content: '',
      order: reportData.sections.length,
    };

    if (type === 'visualization' || type === 'code' || type === 'table') {
      setSectionBeingEdited(newSection);
      setSelectedAssetType(
        type === 'visualization' ? 'visualizations' : type === 'code' ? 'code' : 'tables'
      );
      setIsAssetSelectorOpen(true);
    } else {
      setReportData({
        ...reportData,
        sections: [...reportData.sections, newSection],
      });
    }
  };

  const selectAsset = (asset: AssetItem) => {
    if (!sectionBeingEdited) return;

    const updatedSection = {
      ...sectionBeingEdited,
      title: asset.title,
      content: asset.id,
    };

    setReportData({
      ...reportData,
      sections: [...reportData.sections, updatedSection],
    });

    setIsAssetSelectorOpen(false);
    setSectionBeingEdited(null);
  };

  const removeSection = (sectionId: string) => {
    setReportData({
      ...reportData,
      sections: reportData.sections
        .filter((s) => s.id !== sectionId)
        .map((s, i) => ({ ...s, order: i })),
    });
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    const sectionIndex = reportData.sections.findIndex((s) => s.id === sectionId);
    if (
      (direction === 'up' && sectionIndex === 0) ||
      (direction === 'down' && sectionIndex === reportData.sections.length - 1)
    ) {
      return;
    }

    const newSections = [...reportData.sections];
    const targetIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;

    // Swap sections
    [newSections[sectionIndex], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[sectionIndex],
    ];

    // Update order property
    newSections.forEach((section, index) => {
      section.order = index;
    });

    setReportData({
      ...reportData,
      sections: newSections,
    });
  };

  const handleSectionTitleChange = (sectionId: string, title: string) => {
    setReportData({
      ...reportData,
      sections: reportData.sections.map((s) => (s.id === sectionId ? { ...s, title } : s)),
    });
  };

  const handleSectionContentChange = (sectionId: string, content: string) => {
    setReportData({
      ...reportData,
      sections: reportData.sections.map((s) => (s.id === sectionId ? { ...s, content } : s)),
    });
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    if (!destination) return;
    if (destination.index === source.index) return;

    const newSections = Array.from(reportData.sections);
    const [removed] = newSections.splice(source.index, 1);
    newSections.splice(destination.index, 0, removed);

    // Update order property
    newSections.forEach((section, index) => {
      section.order = index;
    });

    setReportData({
      ...reportData,
      sections: newSections,
    });
  };

  const handleSaveReport = async () => {
    try {
      setIsSaving(true);

      // Validate report data
      if (!reportData.title) {
        toast.error('Please provide a report title');
        setIsSaving(false);
        return;
      }

      if (reportData.sections.length === 0) {
        toast.error('Please add at least one section to the report');
        setIsSaving(false);
        return;
      }

      // Save to API
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reportData,
          author: 'DATAGEN Assistant', // This would come from authentication in production
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to save report');
      }

      toast.success('Report created successfully');
      setTimeout(() => {
        router.push('/dashboard/reports');
      }, 1000);
    } catch (error) {
      clientLogger.error('Failed to save report', { error });
      toast.error('Failed to save report');
    } finally {
      setIsSaving(false);
    }
  };

  const goBack = () => {
    router.push('/dashboard/reports');
  };

  const getSectionIcon = (type: ReportSectionType) => {
    switch (type) {
      case 'text':
        return <FileText className='h-4 w-4' />;
      case 'visualization':
        return <ImageIcon className='h-4 w-4' alt="Visualization icon" />;
      case 'code':
        return <Code className='h-4 w-4' />;
      case 'table':
        return <Table className='h-4 w-4' />;
      case 'financial':
        return <DollarSign className='h-4 w-4' />;
    }
  };

  return (
    <div className='container mx-auto p-6'>
      <div className='flex justify-between items-center mb-6'>
        <Button variant='ghost' size='sm' onClick={goBack}>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Reports
        </Button>

        <Button onClick={handleSaveReport} disabled={isSaving} className='flex items-center'>
          {isSaving ? (
            <>
              <div className='animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full' />
              Saving...
            </>
          ) : (
            <>
              <Save className='h-4 w-4 mr-2' />
              Save Report
            </>
          )}
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Report Metadata */}
        <div className='lg:col-span-1 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='title'>Title</Label>
                <Input
                  id='title'
                  placeholder='Enter report title'
                  value={reportData.title}
                  onChange={handleTitleChange}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='description'>Description</Label>
                <Textarea
                  id='description'
                  placeholder='Enter report description'
                  rows={4}
                  value={reportData.description}
                  onChange={handleDescriptionChange}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='type'>Report Type</Label>
                <Select value={reportData.type} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select report type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='it-strategy'>IT Strategy</SelectItem>
                    <SelectItem value='financial-analysis'>Financial Analysis</SelectItem>
                    <SelectItem value='technical-review'>Technical Review</SelectItem>
                    <SelectItem value='custom'>Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='tags'>Tags</Label>
                <div className='flex flex-wrap gap-2 mb-2'>
                  {reportData.tags.map((tag) => (
                    <div
                      key={tag}
                      className='bg-muted text-muted-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1'
                    >
                      {tag}
                      <button
                        type='button'
                        onClick={() => handleRemoveTag(tag)}
                        className='text-muted-foreground/70 hover:text-destructive'
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <Input
                  id='tags'
                  placeholder='Enter tag and press Enter'
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Sections</CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-2'>
              <Button
                variant='outline'
                className='flex flex-col p-4 h-auto space-y-2 shadow-sm'
                onClick={() => addSection('text')}
              >
                <FileText className='h-8 w-8' />
                <span>Text</span>
              </Button>

              <Button
                variant='outline'
                className='flex flex-col p-4 h-auto space-y-2 shadow-sm'
                onClick={() => addSection('visualization')}
              >
                <ImageIcon className='h-8 w-8' alt="Visualization icon" />
                <span>Visualization</span>
              </Button>

              <Button
                variant='outline'
                className='flex flex-col p-4 h-auto space-y-2 shadow-sm'
                onClick={() => addSection('code')}
              >
                <Code className='h-8 w-8' />
                <span>Code</span>
              </Button>

              <Button
                variant='outline'
                className='flex flex-col p-4 h-auto space-y-2 shadow-sm'
                onClick={() => addSection('table')}
              >
                <Table className='h-8 w-8' />
                <span>Table</span>
              </Button>

              <Button
                variant='outline'
                className='flex flex-col p-4 h-auto space-y-2 shadow-sm'
                onClick={() => addSection('financial')}
              >
                <DollarSign className='h-8 w-8' />
                <span>Financial</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Report Content */}
        <div className='lg:col-span-2'>
          <Card className='h-full'>
            <CardHeader>
              <CardTitle>Report Content</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData.sections.length === 0 ? (
                <div className='flex flex-col items-center justify-center border border-dashed rounded-md py-12'>
                  <p className='text-muted-foreground mb-4'>Your report is empty</p>
                  <Button variant='outline' onClick={() => addSection('text')}>
                    <Plus className='h-4 w-4 mr-2' />
                    Add a Section
                  </Button>
                </div>
              ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId='sections'>
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className='space-y-4'
                      >
                        {reportData.sections
                          .slice()
                          .sort((a, b) => a.order - b.order)
                          .map((section, index) => (
                            <Draggable key={section.id} draggableId={section.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className='border rounded-md overflow-hidden'
                                >
                                  <div
                                    className='bg-muted px-4 py-2 flex justify-between items-center'
                                    {...provided.dragHandleProps}
                                  >
                                    <div className='flex items-center gap-2'>
                                      {getSectionIcon(section.type)}
                                      <Input
                                        className='h-8 w-auto border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0'
                                        value={section.title}
                                        onChange={(e) =>
                                          handleSectionTitleChange(section.id, e.target.value)
                                        }
                                      />
                                    </div>
                                    <div className='flex items-center gap-1'>
                                      <Button
                                        variant='ghost'
                                        size='icon'
                                        onClick={() => moveSection(section.id, 'up')}
                                        disabled={index === 0}
                                        className='h-7 w-7'
                                      >
                                        <MoveUp className='h-4 w-4' />
                                      </Button>
                                      <Button
                                        variant='ghost'
                                        size='icon'
                                        onClick={() => moveSection(section.id, 'down')}
                                        disabled={index === reportData.sections.length - 1}
                                        className='h-7 w-7'
                                      >
                                        <MoveDown className='h-4 w-4' />
                                      </Button>
                                      <Button
                                        variant='ghost'
                                        size='icon'
                                        onClick={() => removeSection(section.id)}
                                        className='h-7 w-7 text-destructive'
                                      >
                                        <Trash2 className='h-4 w-4' />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className='p-4'>
                                    {section.type === 'text' && (
                                      <Textarea
                                        placeholder='Enter text content'
                                        value={section.content}
                                        onChange={(e) =>
                                          handleSectionContentChange(section.id, e.target.value)
                                        }
                                        rows={6}
                                        className='resize-none'
                                      />
                                    )}

                                    {section.type === 'visualization' && (
                                      <div className='flex justify-center'>
                                        <div className="relative w-[600px] h-[300px]">
                                          <Image
                                            src={
                                              section.content
                                                ? `https://via.placeholder.com/600x300?text=${encodeURIComponent(section.title)}`
                                                : 'https://via.placeholder.com/600x300?text=Select+Visualization'
                                            }
                                            alt={section.title || "Visualization placeholder"}
                                            fill
                                            className='object-cover rounded border'
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {section.type === 'code' && (
                                      <div className='bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto'>
                                        {section.content || 'Select code snippet'}
                                      </div>
                                    )}

                                    {section.type === 'table' && (
                                      <div className='border rounded-md overflow-hidden w-full'>
                                        {section.content ? (
                                          <table className='w-full'>
                                            <thead>
                                              <tr className='bg-muted'>
                                                <th className='p-2 text-left'>Column 1</th>
                                                <th className='p-2 text-left'>Column 2</th>
                                                <th className='p-2 text-left'>Column 3</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              <tr>
                                                <td className='p-2'>Data 1</td>
                                                <td className='p-2'>Data 2</td>
                                                <td className='p-2'>Data 3</td>
                                              </tr>
                                              <tr>
                                                <td className='p-2'>Data 4</td>
                                                <td className='p-2'>Data 5</td>
                                                <td className='p-2'>Data 6</td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        ) : (
                                          <div className='p-4 text-center text-muted-foreground'>
                                            Select table data
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {section.type === 'financial' && (
                                      <div className='border rounded-md overflow-hidden w-full'>
                                        {section.content ? (
                                          <table className='w-full'>
                                            <thead>
                                              <tr className='bg-muted'>
                                                <th className='p-2 text-left'>Item</th>
                                                <th className='p-2 text-left'>Cost</th>
                                                <th className='p-2 text-left'>ROI</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              <tr>
                                                <td className='p-2'>Item 1</td>
                                                <td className='p-2'>$10,000</td>
                                                <td className='p-2'>15%</td>
                                              </tr>
                                              <tr>
                                                <td className='p-2'>Item 2</td>
                                                <td className='p-2'>$25,000</td>
                                                <td className='p-2'>22%</td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        ) : (
                                          <div className='p-4 text-center text-muted-foreground'>
                                            Select financial data
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
            {reportData.sections.length > 0 && (
              <CardFooter className='flex justify-center border-t pt-4'>
                <div className='flex flex-wrap gap-2 justify-center'>
                  <Button variant='outline' size='sm' onClick={() => addSection('text')}>
                    <FileText className='h-4 w-4 mr-1' />
                    Add Text
                  </Button>

                  <Button variant='outline' size='sm' onClick={() => addSection('visualization')}>
                    <ImageIcon className='h-4 w-4 mr-1' alt="Visualization preview" />
                    Add Visualization
                  </Button>

                  <Button variant='outline' size='sm' onClick={() => addSection('code')}>
                    <Code className='h-4 w-4 mr-1' />
                    Add Code
                  </Button>

                  <Button variant='outline' size='sm' onClick={() => addSection('table')}>
                    <Table className='h-4 w-4 mr-1' />
                    Add Table
                  </Button>

                  <Button variant='outline' size='sm' onClick={() => addSection('financial')}>
                    <DollarSign className='h-4 w-4 mr-1' />
                    Add Financial
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      {/* Asset Selector Dialog */}
      <Dialog open={isAssetSelectorOpen} onOpenChange={setIsAssetSelectorOpen}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Select Asset</DialogTitle>
            <DialogDescription>Choose an asset to add to your report</DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue='visualizations'
            value={selectedAssetType}
            onValueChange={(v) => setSelectedAssetType(v as 'visualizations' | 'code' | 'tables')}
          >
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='visualizations'>Visualizations</TabsTrigger>
              <TabsTrigger value='code'>Code Snippets</TabsTrigger>
              <TabsTrigger value='tables'>Tables</TabsTrigger>
            </TabsList>

            <ScrollArea className='max-h-[500px] overflow-y-auto pr-4 mt-2'>
              <TabsContent value='visualizations' className='mt-0 pt-2'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {mockVisualizations.map((viz) => (
                    <Card
                      key={viz.id}
                      className='cursor-pointer hover:border-primary transition-all'
                      onClick={() => selectAsset(viz)}
                    >
                      <CardContent className='p-0'>
                        <div className="relative w-full h-32">
                          <Image
                            src={viz.preview || "https://via.placeholder.com/400x200?text=No+Preview"}
                            alt={viz.title || "Visualization"}
                            fill
                            className='object-cover object-center rounded-t-md'
                          />
                        </div>
                        <div className='p-4'>
                          <h3 className='text-sm font-medium'>{viz.title}</h3>
                          <p className='text-xs text-muted-foreground mt-1'>{viz.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value='code' className='mt-0 pt-2'>
                <div className='grid grid-cols-1 gap-4'>
                  {mockCodeSnippets.map((snippet) => (
                    <Card
                      key={snippet.id}
                      className='cursor-pointer hover:border-primary transition-all'
                      onClick={() => selectAsset(snippet)}
                    >
                      <CardContent className='p-4'>
                        <div className='flex items-start gap-3'>
                          <Code className='h-8 w-8 text-muted-foreground' />
                          <div>
                            <h3 className='text-sm font-medium'>{snippet.title}</h3>
                            <p className='text-xs text-muted-foreground mt-1'>
                              {snippet.description}
                            </p>
                            <div className='flex items-center gap-2 mt-2'>
                              <span className='text-xs bg-muted px-2 py-0.5 rounded-full'>
                                {snippet.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value='tables' className='mt-0 pt-2'>
                <div className='grid grid-cols-1 gap-4'>
                  {mockTables.map((table) => (
                    <Card
                      key={table.id}
                      className='cursor-pointer hover:border-primary transition-all'
                      onClick={() => selectAsset(table)}
                    >
                      <CardContent className='p-4'>
                        <div className='flex items-start gap-3'>
                          <Table className='h-8 w-8 text-muted-foreground' />
                          <div>
                            <h3 className='text-sm font-medium'>{table.title}</h3>
                            <p className='text-xs text-muted-foreground mt-1'>
                              {table.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsAssetSelectorOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
