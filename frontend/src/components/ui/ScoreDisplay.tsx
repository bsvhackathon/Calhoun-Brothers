import React from 'react';
import './ScoreDisplay.css';

interface ScoreDisplayProps {
  score: number;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score }) => {
  return (
    <div className="score-display">
      <span className="score-label">SCORE:</span>
      <span className="score-value">{Math.floor(score)}</span>
    </div>
  );
};

export default ScoreDisplay; 