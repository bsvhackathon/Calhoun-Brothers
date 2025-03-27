// Configuration for the frontend application

// Use import.meta.env for Vite environment variables
export const config = {
  // WebSocket server URL with fallback
  WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001',
  
  // Payment API URL with fallback
  PAYMENT_API_URL: import.meta.env.VITE_PAYMENT_API_URL || 'http://localhost:3002',
};

export default config; 