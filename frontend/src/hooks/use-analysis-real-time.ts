'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { AnalysisJob, AnalysisRequest, AnalysisResult } from '@/types/analysis';
import { clientLogger } from '@/lib/logger';
import { WebSocketClient } from '@/lib/websocket-client';

// Add the correct API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function useAnalysisRealTime() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<AnalysisJob | null>(null);
  const [jobResults, setJobResults] = useState<AnalysisResult | null>(null);

  // Function to start a new analysis
  const startAnalysis = async (request: AnalysisRequest): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('instructions', request.instructions);

      if (request.additional_params) {
        formData.append('additional_params', JSON.stringify(request.additional_params));
      }

      if (request.files && request.files.length > 0) {
        Array.from(request.files).forEach((file) => {
          formData.append('files', file);
        });
      }

      // Send to the FastAPI backend
      const response = await fetch(`${API_BASE_URL}/api/analysis`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start analysis');
      }

      const data = await response.json();
      
      // Check if the response has the expected structure
      if (!data.success || !data.data) {
        throw new Error('Invalid response format from server');
      }
      
      const jobData = data.data;
      setJobStatus(jobData);

      // Subscribe to job updates
      subscribeToJobUpdates(jobData.job_id);

      return jobData.job_id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      clientLogger.error('Failed to start analysis', { error: err });
      setError(errorMessage);
      toast.error(`Failed to start analysis: ${errorMessage}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch job status
  const fetchJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis/${jobId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Analysis job not found');
          return null;
        }
        throw new Error('Failed to fetch job status');
      }

      const data = await response.json();
      
      // Check if the response has the expected structure
      if (!data.success || !data.data) {
        throw new Error('Invalid response format from server');
      }
      
      const jobData = data.data;
      setJobStatus(jobData);
      
      if (jobData.status === 'completed' && jobData.result) {
        setJobResults(jobData.result);
      }
      
      return jobData;
    } catch (err) {
      clientLogger.error('Failed to fetch job status', { error: err, jobId });
      return null;
    }
  }, []);

  // Function to subscribe to job updates via WebSocket
  const subscribeToJobUpdates = useCallback((jobId: string) => {
    setIsLoading(true);
    
    // Create a WebSocket client
    const wsClient = new WebSocketClient(
      jobId,
      (update) => {
        // Handle job updates
        setJobStatus(update);
        
        // If job is completed, set results
        if (update.status === 'completed' && update.result) {
          setJobResults(update.result);
        }
        
        // Update loading state
        setIsLoading(false);
      },
      (error) => {
        // Handle WebSocket errors
        clientLogger.error('WebSocket error', { error, jobId });
        // Don't set error state here to allow reconnection attempts
      },
      () => {
        // Connection established
        clientLogger.info('WebSocket connected', { jobId });
      },
      () => {
        // Connection closed
        clientLogger.info('WebSocket connection closed', { jobId });
      }
    );
    
    // Connect to WebSocket server
    wsClient.connect();
    
    // Set up keep-alive ping every 30 seconds
    const pingInterval = setInterval(() => {
      if (wsClient.isConnected()) {
        wsClient.ping();
      }
    }, 30000);
    
    // Return cleanup function
    return () => {
      clearInterval(pingInterval);
      wsClient.disconnect();
    };
  }, []);

  // Function to cancel a job
  const cancelJob = async (jobId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel job');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Analysis cancelled');
        // Refresh job status
        await fetchJobStatus(jobId);
        return true;
      }
      
      return false;
    } catch (err) {
      clientLogger.error('Failed to cancel job', { error: err, jobId });
      toast.error('Failed to cancel analysis');
      return false;
    }
  };

  // Reset state
  const resetState = () => {
    setJobStatus(null);
    setJobResults(null);
    setError(null);
  };

  return {
    isLoading,
    error,
    jobStatus,
    jobResults,
    startAnalysis,
    fetchJobStatus,
    cancelJob,
    resetState,
  };
}
