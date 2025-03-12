/**
 * Analysis request and response type definitions
 */

export type AnalysisStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AnalysisJob {
  job_id: string;
  status: AnalysisStatus;
  progress: number;
  started_at: string;
  completed_at?: string;
  current_agent?: string;
  messages: AnalysisMessage[];
  result?: AnalysisResult;
  error?: string;
  file_paths?: string[];
  deleted?: boolean;
}

export interface AnalysisMessage {
  timestamp: string;
  content: string;
  sender: string;
  metadata?: Record<string, unknown>;
}

export interface AnalysisResult {
  summary: string;
  files: string[];
  completion_time: string;
  visualizations?: AnalysisVisualization[];
  code_blocks?: AnalysisCodeBlock[];
  report_sections?: AnalysisReportSection[];
}

export interface AnalysisVisualization {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  type: 'chart' | 'graph' | 'table' | 'image';
  data?: Record<string, unknown>;
  created_at: string;
}

export interface AnalysisCodeBlock {
  id: string;
  title?: string;
  content: string;
  language: string;
  created_at: string;
}

export interface AnalysisReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
  created_at: string;
}

export interface AnalysisRequest {
  instructions: string;
  files?: File[];
  additional_params?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * WebSocket event types
 */
export interface JobUpdateEvent {
  type: 'job_update';
  data: AnalysisJob;
}

export interface AgentMessageEvent {
  type: 'agent_message';
  data: {
    job_id: string;
    message: AnalysisMessage;
  };
}

export interface ErrorEvent {
  type: 'error';
  data: {
    message: string;
    details?: Record<string, unknown>;
  };
}

export type WebSocketEvent = JobUpdateEvent | AgentMessageEvent | ErrorEvent;
