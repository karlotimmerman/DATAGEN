import { clientLogger } from './logger';
import { AnalysisJob } from '@/types/analysis';

export class WebSocketController {
  private static instance: WebSocketController;
  private socket: WebSocket | null = null;
  private jobHandlers: Map<string, (update: AnalysisJob) => void> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketController {
    if (!WebSocketController.instance) {
      WebSocketController.instance = new WebSocketController();
    }
    return WebSocketController.instance;
  }

  public connectToJob(jobId: string, onUpdate: (update: AnalysisJob) => void): () => void {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:8000';
    const wsUrl = `${SOCKET_URL}/api/socket/${jobId}`;
    
    // Store handler
    this.jobHandlers.set(jobId, onUpdate);
    
    // Create WebSocket if not exists
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      clientLogger.info(`Connecting to WebSocket: ${wsUrl}`);
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        clientLogger.info('WebSocket connected');
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as AnalysisJob;
          const handler = this.jobHandlers.get(data.job_id);
          if (handler) {
            handler(data);
          }
        } catch (error) {
          clientLogger.error('Error parsing WebSocket message', { error });
        }
      };
      
      this.socket.onerror = (error) => {
        clientLogger.error('WebSocket error', { error });
      };
      
      this.socket.onclose = () => {
        clientLogger.info('WebSocket closed');
      };
    }
    
    // Return cleanup function
    return () => {
      this.jobHandlers.delete(jobId);
      
      // If no more handlers, close the socket
      if (this.jobHandlers.size === 0 && this.socket) {
        this.socket.close();
        this.socket = null;
      }
    };
  }
} 