import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Leaderboard.css';

interface LeaderboardEntry {
  identityKey: string;
  score: number;
}

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Mock data for demonstration - replace with actual API call
  useEffect(() => {
    const mockData: LeaderboardEntry[] = [
      { identityKey: 'PacMan', score: 3000 },
      { identityKey: 'Galaga', score: 2500 },
      { identityKey: 'SpaceInvader', score: 2000 },
      { identityKey: 'TetrisMaster', score: 1800 },
      { identityKey: 'DonkeyKong', score: 1700 },
      { identityKey: 'Mario', score: 1600 },
      { identityKey: 'Sonic', score: 1500 },
      { identityKey: 'Zelda', score: 1400 },
      { identityKey: 'MegaMan', score: 1300 },
      { identityKey: 'Contra', score: 1200 },
      { identityKey: 'User', score: 1100 },
    ];
    setLeaderboardData(mockData);
    setCurrentUser('User'); // This would come from your auth system
  }, []);

  const getRankedData = () => {
    const sortedData = [...leaderboardData].sort((a, b) => b.score - a.score);
    let currentRank = 1;
    let previousScore = -1;
    let skipCount = 0;

    return sortedData.map((entry, index) => {
      if (entry.score === previousScore) {
        skipCount++;
      } else {
        currentRank += skipCount;
        skipCount = 0;
      }
      previousScore = entry.score;
      return { ...entry, rank: currentRank };
    });
  };

  const handleBack = () => {
    navigate('/');
  };

  const rankedData = getRankedData();
  const shouldShowUser = currentUser && 
    rankedData.findIndex(entry => entry.identityKey === currentUser) >= 10;

  const displayData = shouldShowUser
    ? [...rankedData.slice(0, 10), rankedData.find(entry => entry.identityKey === currentUser)!]
    : rankedData.slice(0, 10);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-screen">
        <h1 className="leaderboard-title">HIGH SCORES</h1>
        <div className="leaderboard-content">
          <div className="leaderboard-header">
            <span>RANK</span>
            <span>PLAYER</span>
            <span>SCORE</span>
          </div>
          <div className="leaderboard-entries">
            {displayData.map((entry, index) => (
              <div 
                key={entry.identityKey} 
                className={`leaderboard-entry ${entry.identityKey === currentUser ? 'current-user' : ''}`}
              >
                <span className="rank">{entry.rank}.</span>
                <span className="player">{entry.identityKey}</span>
                <span className="score">{entry.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <button className="back-button" onClick={handleBack}>
          ← BACK
        </button>
      </div>
    </div>
  );
};

export default Leaderboard; 