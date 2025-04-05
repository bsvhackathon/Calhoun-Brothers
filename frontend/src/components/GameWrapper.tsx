import React, { useEffect, useRef } from 'react';
import { GameClient } from '../core/GameClient';
import './GameWrapper.css';

const GameWrapper: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameClientRef = useRef<GameClient | null>(null);

  useEffect(() => {
    if (gameContainerRef.current && !gameClientRef.current) {
      gameClientRef.current = new GameClient();
      gameClientRef.current.initializeGame();
    }

    return () => {
      if (gameClientRef.current) {
        // Cleanup if needed
        gameClientRef.current = null;
      }
    };
  }, []);

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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