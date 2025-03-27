// src/services/WebSocketService.ts

import config from '../config/config';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private messageCallback: ((data: any) => void) | null = null;

  constructor() {
    // No automatic connection in constructor; connection is explicit via connect()
  }

  /**
   * Connects to the WebSocket server with the provided token.
   * @param url The WebSocket URL including any query parameters (e.g., token)
   */
  connect(url: string): void {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      console.warn('WebSocket already connected or connecting');
      return;
    }

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('Connected to server');
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (this.messageCallback) {
          this.messageCallback(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from server');
      this.ws = null;
    };
  }

  /**
   * Disconnects from the WebSocket server.
   */
  disconnect(): void {
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Sends data to the server if the connection is open.
   * @param data The data to send (will be stringified to JSON)
   */
  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected. Cannot send data:', data);
    }
  }

  /**
   * Registers a callback to handle incoming messages.
   * @param callback Function to call with parsed message data
   */
  onMessage(callback: (data: any) => void): void {
    this.messageCallback = callback;
  }

  /**
   * Checks if the WebSocket connection is currently open.
   * @returns boolean indicating connection status
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Convenience method to connect with a token using the configured WebSocket URL.
   * @param token Authentication token for the connection
   */
  connectWithToken(token: string): void {
    this.connect(`${config.WEBSOCKET_URL}?token=${token}`);
  }
}