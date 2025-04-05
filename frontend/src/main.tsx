// src/main.ts

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Import the Press Start 2P font
import '@fontsource/press-start-2p';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Export the game instance if needed for debugging or external use
// export const game = new GameClient(); // Uncomment if needed for dev tools