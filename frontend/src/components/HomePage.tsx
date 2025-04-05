import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handlePlayGame = () => {
    navigate('/game');
  };

  const handleLeaderboard = () => {
    navigate('/leaderboard');
  };

  return (
    <div className="arcade-container">
      <div className="arcade-screen">
        <h1 className="arcade-title">ChainArcade</h1>
        <div className="arcade-content">
          <p className="arcade-text">Welcome to the Arcade!</p>
          <div className="button-container">
            <button 
              className="arcade-button"
              onClick={handlePlayGame}
            >
              PLAY NOW
            </button>
            <button 
              className="arcade-button"
              onClick={handleLeaderboard}
            >
              LEADERBOARD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage; 