import { clientLogger } from './logger';

/**
 * WebSocketClient class for handling real-time communications
 */
export class WebSocketClient {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private url: string = '';
  private pingInterval = 30000; // 30 seconds

  // Event handlers
  private onOpenHandlers: (() => void)[] = [];
  private onCloseHandlers: (() => void)[] = [];
  private onErrorHandlers: ((error: Event) => void)[] = [];
  private onMessageHandlers: ((data: string) => void)[] = [];

  /**
   * Connect to the WebSocket server
   * @param url WebSocket server URL
   */
  public connect(url: string): void {
    if (this.socket && this.isConnected) {
      clientLogger.info('WebSocket already connected');
      return;
    }

    this.url = url;

    try {
      this.socket = new WebSocket(url);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);

      clientLogger.info('WebSocket connecting...', { url });
    } catch (error) {
      clientLogger.error('WebSocket connection error', { error, url });
      this.attemptReconnect();
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      clientLogger.info('WebSocket disconnected');
    }
  }

  /**
   * Send data to the WebSocket server
   * @param data Data to send
   */
  public send(data: string | object): boolean {
    if (!this.socket || !this.isConnected) {
      clientLogger.error('Cannot send message, WebSocket not connected');
      return false;
    }

    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      this.socket.send(message);
      return true;
    } catch (error) {
      clientLogger.error('Error sending WebSocket message', { error });
      return false;
    }
  }

  /**
   * Register handler for open event
   * @param handler Function to call when connection is established
   */
  public onOpen(handler: () => void): void {
    this.onOpenHandlers.push(handler);
  }

  /**
   * Register handler for close event
   * @param handler Function to call when connection is closed
   */
  public onClose(handler: () => void): void {
    this.onCloseHandlers.push(handler);
  }

  /**
   * Register handler for error event
   * @param handler Function to call when an error occurs
   */
  public onError(handler: (error: Event) => void): void {
    this.onErrorHandlers.push(handler);
  }

  /**
   * Register handler for message event
   * @param handler Function to call when a message is received
   */
  public onMessage(handler: (data: string) => void): void {
    this.onMessageHandlers.push(handler);
  }

  /**
   * Check if the WebSocket is connected
   */
  public isActive(): boolean {
    return this.isConnected;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    clientLogger.info('WebSocket connected');

    // Set up ping interval
    this.setupPingInterval();

    // Call all registered open handlers
    this.onOpenHandlers.forEach((handler) => {
      try {
        handler();
      } catch (error) {
        clientLogger.error('Error in WebSocket open handler', { error });
      }
    });
  }

  /**
   * Set up ping interval to keep connection alive
   */
  private setupPingInterval(): void {
    // Clear any existing ping timer
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    // Set up ping interval to keep connection alive
    this.pingTimer = setInterval(() => {
      if (this.isConnected && this.socket) {
        try {
          this.socket.send('ping');
          clientLogger.debug('Ping sent to WebSocket server');
        } catch (error) {
          clientLogger.error('Error sending ping', { error });
          this.disconnect();
          this.attemptReconnect();
        }
      } else {
        // Socket not connected, clear ping timer
        if (this.pingTimer) {
          clearInterval(this.pingTimer);
          this.pingTimer = null;
        }
      }
    }, this.pingInterval);
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.isConnected = false;
    clientLogger.info('WebSocket closed', { code: event.code, reason: event.reason });

    // Call all registered close handlers
    this.onCloseHandlers.forEach((handler) => {
      try {
        handler();
      } catch (error) {
        clientLogger.error('Error in WebSocket close handler', { error });
      }
    });

    // Attempt to reconnect if not closed intentionally
    if (event.code !== 1000) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    clientLogger.error('WebSocket error', { event });

    // Call all registered error handlers
    this.onErrorHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        clientLogger.error('Error in WebSocket error handler', { error });
      }
    });
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    // Call all registered message handlers
    this.onMessageHandlers.forEach((handler) => {
      try {
        handler(event.data);
      } catch (error) {
        clientLogger.error('Error in WebSocket message handler', { error, data: event.data });
      }
    });
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      clientLogger.error('Max reconnect attempts reached, giving up');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    clientLogger.info(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      if (this.url) {
        this.connect(this.url);
      }
    }, delay);
  }
}
