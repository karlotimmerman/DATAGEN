import { RecentAnalyses } from '@/components/analysis/recent-analyses';
import { DocumentUploader } from '@/components/document/document-uploader';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <DashboardLayout>
      <div className='container mx-auto space-y-8'>
        <h1 className='text-3xl font-bold'>DATAGEN Dashboard</h1>
        <p className='text-muted-foreground'>
          Upload documents for AI-powered analysis and visualization
        </p>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>Upload documents for AI analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUploader />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Analyses</CardTitle>
              <CardDescription>Quick access to your recent analyses</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentAnalyses />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
