import { clientLogger } from './logger';
import { AnalysisJob } from '@/types/analysis';

type MessageHandler = (data: AnalysisJob) => void;
type ErrorHandler = (error: Event) => void;
type ConnectionHandler = () => void;

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectDelay = 1000; // Start with 1s, will increase exponentially
  private isClosing = false; // Flag to prevent reconnecting when intentionally closed
  private jobId: string;
  private url: string;
  
  private messageHandler: MessageHandler;
  private errorHandler: ErrorHandler;
  private openHandler: ConnectionHandler;
  private closeHandler: ConnectionHandler;
  
  constructor(
    jobId: string, 
    messageHandler: MessageHandler,
    errorHandler?: ErrorHandler,
    openHandler?: ConnectionHandler,
    closeHandler?: ConnectionHandler
  ) {
    this.jobId = jobId;
    this.messageHandler = messageHandler;
    this.errorHandler = errorHandler || this.defaultErrorHandler;
    this.openHandler = openHandler || this.defaultOpenHandler;
    this.closeHandler = closeHandler || this.defaultCloseHandler;
    
    // Determine WebSocket URL from environment or fallback
    const wsBase = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_SOCKET_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`)
      : '';
    this.url = `${wsBase}/api/socket/${jobId}`;
  }
  
  // Connect to WebSocket server
  public connect(): void {
    if (this.socket) {
      this.disconnect();
    }
    
    try {
      this.isClosing = false;
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = (event) => {
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        clientLogger.info(`WebSocket connected for job ${this.jobId}`);
        this.openHandler();
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as AnalysisJob;
          this.messageHandler(data);
        } catch (error) {
          clientLogger.error('Error parsing WebSocket message', { error });
        }
      };
      
      this.socket.onclose = (event) => {
        clientLogger.info(`WebSocket closed for job ${this.jobId}`, { code: event.code });
        this.closeHandler();
        
        // Attempt to reconnect if it wasn't intentionally closed
        if (!this.isClosing && !event.wasClean) {
          this.attemptReconnect();
        }
      };
      
      this.socket.onerror = (error) => {
        clientLogger.error(`WebSocket error for job ${this.jobId}`, { error });
        this.errorHandler(error);
      };
    } catch (error) {
      clientLogger.error(`Error creating WebSocket for job ${this.jobId}`, { error });
      // Attempt to reconnect
      this.attemptReconnect();
    }
  }
  
  // Disconnect from WebSocket server
  public disconnect(): void {
    this.isClosing = true;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      // Only close if the socket is open or connecting
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        this.socket.close();
      }
      this.socket = null;
    }
  }
  
  // Send a message to the server
  public send(data: any): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  }
  
  // Check if connected
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  // Send a ping to keep the connection alive
  public ping(): void {
    this.send("ping");
  }
  
  // Default handlers
  private defaultErrorHandler(error: Event): void {
    // Default is to let the error log handle it
  }
  
  private defaultOpenHandler(): void {
    // Default is to do nothing
  }
  
  private defaultCloseHandler(): void {
    // Default is to do nothing
  }
  
  // Attempt to reconnect with exponential backoff
  private attemptReconnect(): void {
    if (this.isClosing || this.reconnectAttempts >= this.maxReconnectAttempts) {
      clientLogger.info(`Max reconnection attempts reached for job ${this.jobId}`);
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(30000, this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1));
    
    clientLogger.info(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
} 