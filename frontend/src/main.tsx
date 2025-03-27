// src/main.ts

import { GameClient } from './core/GameClient';
import './assets/styles/styles.css'; // Import global styles if any

// Function to initialize and start the game
function startGame() {
  try {
    // Create a new instance of the GameClient
    const game = new GameClient();
    
    // Initialize the game
    game.initializeGame();
    
    // Optional: Add any global error handling or initialization logic
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
  } catch (error) {
    console.error('Failed to start game:', error);
    // Optionally display an error message to the user
    document.body.innerHTML = '<h1>Error initializing game. Please try refreshing the page.</h1>';
  }
}

// Start the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', startGame);

// Export the game instance if needed for debugging or external use
// export const game = new GameClient(); // Uncomment if needed for dev tools