'use client';

import { useEffect, useState } from 'react';

import { DashboardSettings } from '@/types';
import { AlertCircle, Code, Cog, Eye, EyeOff, Key, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { clientLogger } from '@/lib/logger';

export default function SettingsPage() {
  const [settings, setSettings] = useState<DashboardSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('api-keys');
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({
    openai: false,
    langchain: false,
    firecrawl: false,
  });
  const [_isApiKeyUpdating, _setIsApiKeyUpdating] = useState(false);
  const [_apiKeySuccess, _setApiKeySuccess] = useState<string | null>(null);
  const [_apiKeyError, _setApiKeyError] = useState<string | null>(null);
  const [_isPasswordUpdating, _setIsPasswordUpdating] = useState(false);
  const [_passwordSuccess, _setPasswordSuccess] = useState<string | null>(null);
  const [_passwordError, _setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings');

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        clientLogger.error('Failed to fetch settings');
        toast.error('Failed to load settings');
      }
    } catch (_) {
      clientLogger.error('Error fetching settings');
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save settings');
      }
    } catch (_) {
      clientLogger.error('Error saving settings');
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleKeyVisibility = (key: string) => {
    setVisibleKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleInputChange = (
    category: 'apiKeys' | 'paths' | 'general',
    key: string,
    value: string | boolean
  ) => {
    if (!settings) return;

    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value,
      },
    });
  };

  if (isLoading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex justify-center items-center min-h-[600px]'>
          <div className='text-center'>
            <div className='animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4'></div>
            <p className='text-muted-foreground'>Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className='container mx-auto p-6'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load settings. Please try refreshing the page.
          </AlertDescription>
        </Alert>
        <Button onClick={fetchSettings} variant='outline' className='mt-4'>
          <RefreshCw className='h-4 w-4 mr-2' />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold'>Settings</h1>
          <p className='text-muted-foreground'>Configure your environment and preferences</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
              Saving...
            </>
          ) : (
            <>
              <Save className='h-4 w-4 mr-2' />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='mb-6'>
          <TabsTrigger value='api-keys'>
            <Key className='h-4 w-4 mr-2' />
            API Keys
          </TabsTrigger>
          <TabsTrigger value='paths'>
            <Code className='h-4 w-4 mr-2' />
            Paths
          </TabsTrigger>
          <TabsTrigger value='general'>
            <Cog className='h-4 w-4 mr-2' />
            General
          </TabsTrigger>
        </TabsList>

        <TabsContent value='api-keys' className='mt-0'>
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Configure the API keys for the services used by DATAGEN
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <Label htmlFor='openai-key'>OpenAI API Key</Label>
                  <Button variant='ghost' size='icon' onClick={() => toggleKeyVisibility('openai')}>
                    {visibleKeys.openai ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </Button>
                </div>
                <div className='flex gap-2'>
                  <Input
                    id='openai-key'
                    type={visibleKeys.openai ? 'text' : 'password'}
                    value={settings.apiKeys.openai}
                    onChange={(e) => handleInputChange('apiKeys', 'openai', e.target.value)}
                    placeholder='sk-...'
                  />
                </div>
                <p className='text-sm text-muted-foreground'>
                  Used for text generation and embedding. Get one from{' '}
                  <a
                    href='https://platform.openai.com/api-keys'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline'
                  >
                    OpenAI
                  </a>
                  .
                </p>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <Label htmlFor='langchain-key'>LangChain API Key</Label>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => toggleKeyVisibility('langchain')}
                  >
                    {visibleKeys.langchain ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </Button>
                </div>
                <div className='flex gap-2'>
                  <Input
                    id='langchain-key'
                    type={visibleKeys.langchain ? 'text' : 'password'}
                    value={settings.apiKeys.langchain}
                    onChange={(e) => handleInputChange('apiKeys', 'langchain', e.target.value)}
                    placeholder='lc-...'
                  />
                </div>
                <p className='text-sm text-muted-foreground'>
                  Used for advanced agent workflows. Get one from{' '}
                  <a
                    href='https://smith.langchain.com/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline'
                  >
                    LangChain
                  </a>
                  .
                </p>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <Label htmlFor='firecrawl-key'>FireCrawl API Key</Label>
                  <Button
                    variant='ghost'
                    size='icon'
                    onClick={() => toggleKeyVisibility('firecrawl')}
                  >
                    {visibleKeys.firecrawl ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </Button>
                </div>
                <div className='flex gap-2'>
                  <Input
                    id='firecrawl-key'
                    type={visibleKeys.firecrawl ? 'text' : 'password'}
                    value={settings.apiKeys.firecrawl}
                    onChange={(e) => handleInputChange('apiKeys', 'firecrawl', e.target.value)}
                    placeholder='fc-...'
                  />
                </div>
                <p className='text-sm text-muted-foreground'>
                  Used for web scraping and crawling. Get one from{' '}
                  <a href='#' className='underline'>
                    FireCrawl
                  </a>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='paths' className='mt-0'>
          <Card>
            <CardHeader>
              <CardTitle>System Paths</CardTitle>
              <CardDescription>
                Configure the paths to various components used by DATAGEN
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='conda-path'>Conda Installation Path</Label>
                <Input
                  id='conda-path'
                  value={settings.paths.condaPath}
                  onChange={(e) => handleInputChange('paths', 'condaPath', e.target.value)}
                  placeholder='/opt/conda'
                />
                <p className='text-sm text-muted-foreground'>The path to your Conda installation</p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='conda-env'>Conda Environment Name</Label>
                <Input
                  id='conda-env'
                  value={settings.paths.condaEnv}
                  onChange={(e) => handleInputChange('paths', 'condaEnv', e.target.value)}
                  placeholder='data_assistant'
                />
                <p className='text-sm text-muted-foreground'>
                  The name of the Conda environment to use for data analysis
                </p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='chromedriver-path'>ChromeDriver Path</Label>
                <Input
                  id='chromedriver-path'
                  value={settings.paths.chromedriverPath}
                  onChange={(e) => handleInputChange('paths', 'chromedriverPath', e.target.value)}
                  placeholder='./chromedriver'
                />
                <p className='text-sm text-muted-foreground'>
                  The path to ChromeDriver for web automation
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='general' className='mt-0'>
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='theme-preference'>Dark Mode</Label>
                  <p className='text-sm text-muted-foreground'>
                    Toggle between light and dark themes
                  </p>
                </div>
                <Switch
                  id='theme-preference'
                  checked={settings.general.theme === 'dark'}
                  onCheckedChange={(checked) =>
                    handleInputChange('general', 'theme', checked ? 'dark' : 'light')
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='notifications'>Notifications</Label>
                  <p className='text-sm text-muted-foreground'>
                    Enable or disable notifications for completed tasks
                  </p>
                </div>
                <Switch
                  id='notifications'
                  checked={settings.general.notifications}
                  onCheckedChange={(checked) =>
                    handleInputChange('general', 'notifications', checked)
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='auto-save'>Auto-Save</Label>
                  <p className='text-sm text-muted-foreground'>
                    Automatically save changes to reports and analyses
                  </p>
                </div>
                <Switch
                  id='auto-save'
                  checked={settings.general.autoSave}
                  onCheckedChange={(checked) => handleInputChange('general', 'autoSave', checked)}
                />
              </div>
            </CardContent>
            <CardFooter>
              <p className='text-xs text-muted-foreground'>
                Note: Some settings may require a restart of the application to take effect.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
