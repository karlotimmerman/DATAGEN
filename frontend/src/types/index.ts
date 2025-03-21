/**
 * Shared type definitions for the DATAGEN project
 * This file contains type definitions used across the frontend
 */

import { 
  AnalysisJob as BackendAnalysisJob,
  AnalysisStatus,
  AnalysisMessage,
  AnalysisResult,
  AnalysisVisualization,
  AnalysisCodeBlock,
  AnalysisReportSection,
  ApiResponse,
  JobResponse,
  StatusResponse
} from './analysis';

// Report types
export type ReportSection = {
  id?: string;
  type: 'heading' | 'paragraph' | 'bulletList' | 'numberList' | 'quote' | 'visualization' | 'table';
  title?: string;
  content: string;
  order?: number;
  subheading?: string;
  attribution?: string;
  caption?: string;
  items?: string[];
  headers?: string[];
  rows?: string[][];
};

export type Report = {
  id: string;
  title: string;
  description?: string;
  author?: string;
  type?: string;
  createdAt: string;
  updatedAt: string;
  sections?: ReportSection[];
  tags?: string[];
  jobId?: string;
};

// Visualization types
export type Visualization = {
  id: string;
  title: string;
  description?: string;
  type: string;
  filePath: string;
  jobId: string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

// Analysis types
export type Analysis = {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  jobId?: string;
  duration?: string;
  dataPoints?: number;
  dataSources?: string[];
  parameters?: Record<string, unknown>;
  summary?: string;
  tags?: string[];
  visualizations?: Visualization[];
  results?: Record<string, unknown>;
};

// Export the backend analysis types for use in the frontend
export type { 
  AnalysisStatus,
  AnalysisMessage,
  AnalysisResult,
  AnalysisVisualization,
  AnalysisCodeBlock,
  AnalysisReportSection
};

// Analysis Job types with naming that matches our frontend convention
export interface AnalysisJob {
  id: string;
  status: AnalysisStatus;
  progress: number;
  startedAt: string;
  completedAt?: string;
  currentAgent?: string;
  messages: AnalysisMessage[];
  result?: AnalysisResult;
  error?: string;
  filePaths?: string[];
  deleted?: boolean;
}

// Helper function to convert snake_case to camelCase
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// Helper function to convert from backend to frontend format
export function convertBackendJob(backendJob: BackendAnalysisJob): AnalysisJob {
  return {
    id: backendJob.job_id,
    status: backendJob.status,
    progress: backendJob.progress,
    startedAt: backendJob.started_at,
    completedAt: backendJob.completed_at,
    currentAgent: backendJob.current_agent,
    messages: backendJob.messages,
    result: backendJob.result ? {
      ...backendJob.result,
      // Convert visualizations if they exist
      visualizations: backendJob.result.visualizations?.map(viz => ({
        ...viz,
        filePath: viz.file_path, // Map backend file_path to frontend filePath
        createdAt: viz.created_at, // Map backend created_at to frontend createdAt
      })),
      // Keep original snake_case property names to match AnalysisResult interface
      code_blocks: backendJob.result.code_blocks?.map(block => ({
        ...block,
        createdAt: block.created_at,
      })),
      report_sections: backendJob.result.report_sections?.map(section => ({
        ...section,
        createdAt: section.created_at,
      })),
      completion_time: backendJob.result.completion_time,
    } : undefined,
    error: backendJob.error,
    filePaths: backendJob.file_paths,
    deleted: backendJob.deleted
  };
}

// Helper function to convert backend visualization to frontend format
export function convertVisualization(backendViz: AnalysisVisualization): Visualization {
  return {
    id: backendViz.id,
    title: backendViz.title,
    description: backendViz.description,
    type: backendViz.type,
    filePath: backendViz.file_path,
    jobId: '', // This would need to be provided separately
    createdAt: backendViz.created_at,
    updatedAt: undefined, // Backend doesn't provide this
    tags: [], // Backend doesn't provide this
    metadata: backendViz.metadata,
  };
}

// Code types
export type CodeFile = {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  size: number;
  type: 'file' | 'directory';
};

// Settings types
export type Settings = {
  id: string;
  apiKey?: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  dataRetentionDays: number;
  maxConcurrentJobs: number;
  defaultLanguage: string;
  apiEndpoint?: string;
  defaultDataSources?: string[];
};

// Dashboard settings type
export interface DashboardSettings {
  apiKeys: {
    openai: string;
    langchain: string;
    firecrawl: string;
  };
  paths: {
    condaPath: string;
    condaEnv: string;
    chromedriverPath: string;
  };
  general: {
    theme: 'light' | 'dark';
    notifications: boolean;
    autoSave: boolean;
  };
}

// User types
export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: string;
  lastLogin?: string;
  settings?: Settings;
};

// Export the response interfaces
export type {
  ApiResponse,
  JobResponse,
  StatusResponse
};
