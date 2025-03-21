import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Visualizations | Data Analysis System',
  description: 'View and explore visualizations from your data analyses',
};

export default function VisualizationsLayout({ children }: { children: React.ReactNode }) {
  return <div className='flex-1 space-y-4 p-4 md:p-8 pt-6'>{children}</div>;
}
