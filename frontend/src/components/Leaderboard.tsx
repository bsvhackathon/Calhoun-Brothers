import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Leaderboard.css';

interface LeaderboardEntry {
  rank: number;
  identityKey: string;
  score: number;
}

const Leaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const abbreviateWalletAddress = (address: string): string => {
    if (address.length <= 8) return address;
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  // Mock data for demonstration - replace with actual API call
  useEffect(() => {
    const mockData: LeaderboardEntry[] = [
      { rank: 1, identityKey: '034e8e1da10a54a6f52562723a410c42a842c34fea87c1c6ff31859282a27a0617', score: 3000 },
      { rank: 2, identityKey: '02a5f1c6e8d9b4a7c3f2e1d0b9a8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0', score: 2500 },
      { rank: 3, identityKey: '03b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6', score: 2000 },
      { rank: 4, identityKey: '04c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7', score: 1800 },
      { rank: 5, identityKey: '05d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8', score: 1700 },
      { rank: 6, identityKey: '06e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9', score: 1600 },
      { rank: 7, identityKey: '07f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0', score: 1500 },
      { rank: 8, identityKey: '08a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1', score: 1400 },
      { rank: 9, identityKey: '09b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2', score: 1300 },
      { rank: 10, identityKey: '0ac3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3', score: 1200 },
      { rank: 11, identityKey: '0bd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4', score: 1100 },
    ];
    setLeaderboardData(mockData);
    setCurrentUser('0bd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4');
  }, []);

  const getRankedData = () => {
    return [...leaderboardData].sort((a, b) => a.rank - b.rank);
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
                title={entry.identityKey}
              >
                <span className="rank">{entry.rank}.</span>
                <span className="player">{abbreviateWalletAddress(entry.identityKey)}</span>
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