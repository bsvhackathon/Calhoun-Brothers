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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abbreviateWalletAddress = (address: string): string => {
    if (address.length <= 8) return address;
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        const response = await fetch('http://localhost:3001/leaderboard');
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        const data = await response.json();
        setLeaderboardData(data);
        // For now, we'll set the current user to the first entry
        // In a real app, you would get this from your auth context
        if (data.length > 0) {
          setCurrentUser(data[0].identityKey);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
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

  if (isLoading) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-screen">
          <h1 className="leaderboard-title">Loading...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard-container">
        <div className="leaderboard-screen">
          <h1 className="leaderboard-title">Error</h1>
          <p className="error-message">{error}</p>
          <button className="back-button" onClick={handleBack}>
            ← BACK
          </button>
        </div>
      </div>
    );
  }

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