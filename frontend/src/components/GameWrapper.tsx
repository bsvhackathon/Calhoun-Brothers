import React, { useEffect, useRef, useState } from 'react';
import { GameClient } from '../core/GameClient';
import ScoreDisplay from './ui/ScoreDisplay';
import './GameWrapper.css';

const GameWrapper: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameClientRef = useRef<GameClient | null>(null);
  const [score, setScore] = useState(0);

  const cleanupGameElements = () => {
    // Remove the game container from the DOM
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
      gameContainer.remove();
    }
    
    // Remove all game UI elements
    const elementsToRemove = [
      '#connectWalletButton',
      '#creditsDisplay',
      '#startGameButton',
      '#gameInstructions',
      '.game-over',
      '.connect-button',
      '.credits-display',
      '.start-button'
    ];

    elementsToRemove.forEach(selector => {
      const element = document.querySelector(selector);
      if (element) {
        element.remove();
      }
    });

    gameClientRef.current = null;
  };

  useEffect(() => {
    if (gameContainerRef.current && !gameClientRef.current) {
      gameClientRef.current = new GameClient();
      gameClientRef.current.initializeGame();
    }

    // Add popstate listener for browser back button
    const handlePopState = () => {
      cleanupGameElements();
    };

    window.addEventListener('popstate', handlePopState);

    // Cleanup function
    return () => {
      cleanupGameElements();
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Separate useEffect for score updates
  useEffect(() => {
    const scoreInterval = setInterval(() => {
      if (gameClientRef.current) {
        const currentScore = gameClientRef.current.getScore();
        setScore(currentScore);
      }
    }, 200);

    return () => {
      clearInterval(scoreInterval);
    };
  }, []); // Empty dependency array since we only need to set this up once

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    cleanupGameElements();
    window.location.href = '/';
  };

  return (
    <div className="game-container">
      <button 
        className="back-button" 
        onClick={handleBack}
      >
        ← BACK
      </button>
      <ScoreDisplay score={score} />
      <div 
        ref={gameContainerRef} 
        style={{ 
          width: '100%', 
          height: '100vh',
          position: 'relative',
          overflow: 'hidden'
        }} 
      />
    </div>
  );
};

export default GameWrapper; 