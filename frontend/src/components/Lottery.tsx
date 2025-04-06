import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LotteryService, PastLottery } from '../services/LotteryService';
import './Lottery.css';

interface LotteryState {
  pastLotteries: PastLottery[];
  currentQueue: string[];
  upcomingLotteries: PastLottery[];
  selectedLottery: PastLottery | null;
  isWheelSpinning: boolean;
}

const Lottery: React.FC = () => {
  const navigate = useNavigate();
  const lotteryService = new LotteryService();
  const [state, setState] = useState<LotteryState>({
    pastLotteries: [],
    currentQueue: [],
    upcomingLotteries: [],
    selectedLottery: null,
    isWheelSpinning: false,
  });

  const formatAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  useEffect(() => {
    const fetchLotteries = async () => {
      const [completedLotteries, currentQueue, upcomingLotteries] = await Promise.all([
        lotteryService.getCompletedLotteries(),
        lotteryService.getCurrentQueue(),
        lotteryService.getUpcomingLotteries()
      ]);
      
      setState(prev => ({
        ...prev,
        pastLotteries: completedLotteries,
        currentQueue: currentQueue,
        upcomingLotteries: upcomingLotteries
      }));
    };

    fetchLotteries();
  }, []);

  const handleDraw = () => {
    if (state.currentQueue.length === 0) return;
    
    setState(prev => ({ ...prev, isWheelSpinning: true }));
    
    // Simulate wheel spinning animation
    setTimeout(() => {
      const winner = state.currentQueue[Math.floor(Math.random() * state.currentQueue.length)];
      const newLottery: PastLottery = {
        id: state.pastLotteries.length + 1,
        date: new Date().toISOString().split('T')[0],
        participants: state.currentQueue.length,
        winner,
        prize: state.currentQueue.length * 100,
      };

      setState(prev => ({
        ...prev,
        pastLotteries: [newLottery, ...prev.pastLotteries],
        currentQueue: [],
        isWheelSpinning: false,
      }));
    }, 5000);
  };

  const handleViewLottery = (lottery: PastLottery) => {
    setState(prev => ({ ...prev, selectedLottery: lottery }));
  };

  const handleCloseModal = () => {
    setState(prev => ({ ...prev, selectedLottery: null }));
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="lottery-container">
      <div className="lottery-screen">
        <button className="back-button" onClick={handleBack}>
          ← BACK
        </button>
        <h1 className="lottery-title">CHAIN ARCADE LOTTERY</h1>

        <div className="lottery-grid">
          {/* Current Queue Section */}
          <div className="queue-section">
            <h2>CURRENT QUEUE</h2>
            <div className="queue-slots">
              {state.currentQueue.map((player: any, index) => (
                <div key={index} className="queue-slot">
                  <span className="slot-number">Slot {index + 1}</span>
                  <span className="slot-player">{formatAddress(player?.identity?.identityKey)}</span>
                </div>
              ))}
            </div>
            <div className="queue-status">
              {state.currentQueue.length === 0 && <p>Queue is empty</p>}
            </div>
          </div>

          {/* Upcoming Lotteries Section */}
          <div className="upcoming-lotteries-section">
            <h2>UPCOMING LOTTERIES</h2>
            <div className="lottery-list">
              {state.upcomingLotteries.map((lottery: any, index) => (
                <div key={index} className="lottery-card">
                  <div className="lottery-info">
                  <span>Date: {formatDate(lottery.createdAt)}</span>
                    <span>Participants: 10</span>
                    <span>Prize: 10 sats</span>
                  </div>
                  <button
                    className="view-button"
                    onClick={() => handleViewLottery(lottery)}
                  >
                    VIEW
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Past Lotteries Section */}
          <div className="past-lotteries-section">
            <h2>PAST LOTTERIES</h2>
            <div className="lottery-list">
              {state.pastLotteries.map((lottery: any, index) => (
                <div key={index} className="lottery-card">
                  <div className="lottery-info">
                    <span>Date: {formatDate(lottery.createdAt)}</span>
                    <span>Participants: 10</span>
                    <span>Winner: {formatAddress(lottery?.winningIdentityKey)}</span>
                    <span>Prize: 10 sats</span>
                  </div>
                  <button
                    className="view-button"
                    onClick={() => handleViewLottery(lottery)}
                  >
                    VIEW
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lottery Details Modal */}
        {state.selectedLottery && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="close-button" onClick={handleCloseModal}>
                CLOSE
              </button>
              <h2>Lottery #{state.selectedLottery.id}</h2>
              <div className="modal-details">
                <div className="participants-list">
                  <h3>Participants</h3>
                  {Array.from({ length: state.selectedLottery.participants }).map((_, index) => (
                    <div key={index} className="participant">
                      Player {index + 1}
                    </div>
                  ))}
                </div>
                <div className="wheel-container">
                  <div className="wheel-pointer" />
                  <div className={`wheel ${state.isWheelSpinning ? 'spinning' : ''}`}>
                    {Array.from({ length: state.selectedLottery?.participants || 0 }).map((_, index) => {
                      const winnerIndex = state.selectedLottery?.winner ? 
                        state.selectedLottery.winner.split('...')[0] : null;
                      const isWinner = winnerIndex && 
                        state.currentQueue.findIndex(addr => addr.startsWith(winnerIndex)) === index;
                      
                      return (
                        <div
                          key={index}
                          className={`wheel-segment ${isWinner ? 'winner' : ''}`}
                          style={{
                            transform: `rotate(${(360 / (state.selectedLottery?.participants || 1)) * index}deg)`,
                          }}
                        >
                          {index + 1}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lottery; 