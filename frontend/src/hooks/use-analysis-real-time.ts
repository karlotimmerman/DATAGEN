'use client';

import { useCallback, useEffect, useState } from 'react';

import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

import { AnalysisJob, AnalysisRequest, AnalysisResult } from '@/types/analysis';

import { clientLogger } from '@/lib/logger';

// Define API endpoints
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || '';

export function useAnalysisRealTime() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<AnalysisJob | null>(null);
  const [jobResults, setJobResults] = useState<AnalysisResult | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // Only connect if we have a socket URL
    if (!SOCKET_URL) return;

    const socketInstance = io(SOCKET_URL, {
      path: '/api/socket',
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      clientLogger.info('WebSocket connected');
    });

    socketInstance.on('disconnect', () => {
      clientLogger.info('WebSocket disconnected');
    });

    socketInstance.on('connect_error', (err) => {
      clientLogger.error('WebSocket connection error', err);
    });

    setSocket(socketInstance);

    // Clean up on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);

  /**
   * Subscribe to real-time updates for a specific job
   */
  const subscribeToJobUpdates = useCallback(
    (jobId: string) => {
      if (!socket) return;

      // Join the job's room
      socket.emit('join', jobId);

      // Listen for job updates
      const handleJobUpdate = (update: AnalysisJob) => {
        clientLogger.debug('Received job update', { jobId, update });
        setJobStatus(update);

        // If job is completed, set results
        if (update.status === 'completed' && update.result) {
          setJobResults(update.result);
        }
      };

      socket.on('job_update', handleJobUpdate);

      // Return cleanup function
      return () => {
        socket.off('job_update', handleJobUpdate);
        socket.emit('leave', jobId);
      };
    },
    [socket]
  );

  /**
   * Start a new analysis
   */
  const startAnalysis = async (request: AnalysisRequest): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('instructions', request.instructions);

      if (request.additional_params) {
        formData.append('additional_params', JSON.stringify(request.additional_params));
      }

      if (request.files && request.files.length > 0) {
        // Added type assertion because forEach on FileList isn't recognized directly
        Array.from(request.files).forEach((file) => {
          formData.append('files', file);
        });
      }

      // Send the request
      const response = await fetch(`${API_BASE_URL}/api/analysis`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start analysis');
      }

      const data = await response.json();

      if (!data.success || !data.data?.job_id) {
        throw new Error('Invalid response from server');
      }

      const jobId = data.data.job_id;

      // Start polling for updates if WebSockets aren't available
      if (!socket) {
        pollJobStatus(jobId);
      }

      return jobId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start analysis';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Poll for job status updates (fallback if WebSockets aren't available)
   */
  const pollJobStatus = async (jobId: string) => {
    try {
      const status = await getJobStatus(jobId);

      // If job is still running, continue polling
      if (status.status === 'queued' || status.status === 'running') {
        setTimeout(() => pollJobStatus(jobId), 5000); // Poll every 5 seconds
      }
    } catch (error) {
      clientLogger.error('Error polling job status', { jobId, error });
    }
  };

  /**
   * Get the status of a job
   */
  const getJobStatus = async (jobId: string): Promise<AnalysisJob> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis/${jobId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch job status');
      }

      const data = await response.json();

      if (!data.success || !data.data) {
        throw new Error('Invalid response from server');
      }

      const jobStatus = data.data as AnalysisJob;
      setJobStatus(jobStatus);

      // If job is completed, set results
      if (jobStatus.status === 'completed' && jobStatus.result) {
        setJobResults(jobStatus.result);
      }

      return jobStatus;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job status';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancel a running job
   */
  const cancelJob = async (jobId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analysis/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel job');
      }

      toast.success('Job cancelled successfully');

      // Refresh job status
      await getJobStatus(jobId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel job';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    jobStatus,
    jobResults,
    startAnalysis,
    getJobStatus,
    cancelJob,
    subscribeToJobUpdates,
  };
}
