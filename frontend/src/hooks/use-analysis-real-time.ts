'use client';

import { useCallback, useEffect, useState } from 'react';

import { AnalysisJob as BackendAnalysisJob } from '@/types/analysis';
import { AnalysisJob, convertBackendJob, StatusResponse } from '@/types';

import { clientLogger } from '@/lib/logger';
import { WebSocketClient } from '@/lib/websocket-client';

// Define constants
const POLLING_INTERVAL = 5000; // 5 seconds

// Create a shared WebSocket client instance
let wsClientInstance: WebSocketClient | null = null;

function getWsClient(): WebSocketClient {
  if (!wsClientInstance) {
    wsClientInstance = new WebSocketClient();
  }
  return wsClientInstance;
}

export function useAnalysisRealTime(jobId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<string>('pending');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Function to fetch job status via REST API - moved up before it's used
  const fetchJobStatus = useCallback(async (retryCount = 0, maxRetries = 3) => {
    if (!isOnline) return; // Don't attempt if offline
    
    try {
      const response = await fetch(`/api/analysis/${jobId}/status`);

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json() as StatusResponse;

      if (data.success) {
        // Clear any previous errors
        if (error) setError(null);
        
        if (data.status) setStatus(data.status);
        if (data.progress !== undefined) setProgress(data.progress);
        if (data.logs) setLogs(data.logs);
        
        // If job data is included, process it
        if (data.job) {
          const job = convertBackendJob(data.job);
          // Additional processing with job data if needed
        }
      } else {
        throw new Error(data.message || 'Failed to fetch job status');
      }
    } catch (err) {
      const errorMessage = `Failed to fetch job status: ${err}`;
      clientLogger.error(errorMessage, { error: err, jobId });
      
      // Only set error state if we've exhausted retries
      if (retryCount >= maxRetries) {
        setError(errorMessage);
      } else {
        // Retry with exponential backoff
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s...
        clientLogger.info(`Retrying fetchJobStatus in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        setTimeout(() => fetchJobStatus(retryCount + 1, maxRetries), delay);
      }
    }
  }, [jobId, isOnline, error]);

  // Initialize connection and set up event handlers
  useEffect(() => {
    if (!jobId) return;

    try {
      // Get WebSocket client instance
      const wsClient = getWsClient();

      // Set up WebSocket connection
      wsClient.connect(`ws://localhost:8000/api/socket/${jobId}`);

      // Handle websocket events
      wsClient.onOpen(() => {
        setIsConnected(true);
        clientLogger.info('WebSocket connected for job', { jobId });
      });

      wsClient.onClose(() => {
        setIsConnected(false);
        clientLogger.info('WebSocket disconnected', { jobId });
      });

      wsClient.onError((wsError: Event) => {
        const errorMessage = wsError instanceof ErrorEvent ? wsError.message : 'Unknown error';
        setError(`WebSocket error: ${errorMessage}`);
        clientLogger.error('WebSocket error', { error: errorMessage, jobId });
      });

      wsClient.onMessage((wsData: string) => {
        try {
          // Ignore pong messages
          if (wsData === "pong") {
            return;
          }
          
          // Parse the message as JSON
          const message = JSON.parse(wsData);
          
          // Handle different message formats
          const handleBackendJob = (job: BackendAnalysisJob) => {
            const frontendJob = convertBackendJob(job);
            setStatus(frontendJob.status);
            setProgress(frontendJob.progress);
            
            // Extract logs from messages
            if (frontendJob.messages && frontendJob.messages.length > 0) {
              const logMessages = frontendJob.messages
                .filter(msg => msg.sender !== 'human')
                .map(msg => msg.content);
              
              if (logMessages.length > 0) {
                setLogs(prev => {
                  // Filter out duplicate messages
                  const newLogs = [...prev];
                  for (const msg of logMessages) {
                    if (!newLogs.includes(msg)) {
                      newLogs.push(msg);
                    }
                  }
                  return newLogs;
                });
              }
            }
          };
          
          // If the message is a job object itself (direct from API server)
          if (message.job_id && message.status) {
            handleBackendJob(message);
          } 
          // If the message is in StatusResponse format
          else if (message.success !== undefined) {
            const response = message as StatusResponse;
            
            if (response.status) {
              setStatus(response.status);
            }
            
            if (response.progress !== undefined) {
              setProgress(response.progress);
            }
            
            if (response.logs && response.logs.length > 0) {
              setLogs(prev => {
                // Filter out duplicate messages
                const newLogs = [...prev];
                for (const msg of response.logs || []) {
                  if (!newLogs.includes(msg)) {
                    newLogs.push(msg);
                  }
                }
                return newLogs;
              });
            }
            
            // Handle job data if present
            if (response.job) {
              handleBackendJob(response.job);
            }
          }
        } catch (err) {
          clientLogger.error('Error parsing websocket message', { error: err, data: wsData });
        }
      });

      // Fetch initial status
      fetchJobStatus();
    } catch (err) {
      setError(`Failed to initialize websocket: ${err}`);
      clientLogger.error('Failed to initialize websocket', { error: err, jobId });
    }

    // Clean up on unmount
    return () => {
      const wsClient = getWsClient();
      wsClient.disconnect();
    };
  }, [jobId, fetchJobStatus]);

  // Function to cancel a job
  const cancelJob = useCallback(async () => {
    try {
      const response = await fetch(`/api/analysis/${jobId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        return true;
      } else {
        throw new Error(data.message || 'Failed to cancel job');
      }
    } catch (err) {
      setError(`Failed to cancel job: ${err}`);
      clientLogger.error('Failed to cancel job', { error: err, jobId });
      return false;
    }
  }, [jobId]);

  // Function to restart a job
  const restartJob = useCallback(async () => {
    try {
      const response = await fetch(`/api/analysis/${jobId}/restart`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Reset state
        setStatus('pending');
        setProgress(0);
        setLogs([]);
        setError(null);
        return true;
      } else {
        throw new Error(data.message || 'Failed to restart job');
      }
    } catch (err) {
      setError(`Failed to restart job: ${err}`);
      clientLogger.error('Failed to restart job', { error: err, jobId });
      return false;
    }
  }, [jobId]);

  // Polls for status updates as a fallback when websocket is not available
  useEffect(() => {
    // Skip if we're using websockets
    if (isConnected) return;

    // Skip if we're done
    if (status === 'completed' || status === 'failed' || status === 'cancelled') return;

    // Initial fetch
    fetchJobStatus();

    // Set up polling
    const interval = setInterval(() => {
      fetchJobStatus();
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [status, isConnected, fetchJobStatus]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      clientLogger.info('Network connection restored');
      // Attempt to reconnect WebSocket and refresh data
      fetchJobStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      clientLogger.warn('Network connection lost');
      setError('Network connection lost. Waiting for reconnection...');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  return {
    status,
    progress,
    logs,
    isConnected,
    isOnline,
    error,
    cancelJob,
    restartJob,
  };
}
