import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Lottery.css';

interface PastLottery {
  id: number;
  date: string;
  participants: number;
  winner: string;
  prize: number;
}

interface LotteryState {
  pastLotteries: PastLottery[];
  currentQueue: string[];
  upcomingLotteries: PastLottery[];
  selectedLottery: PastLottery | null;
  isWheelSpinning: boolean;
}

const Lottery: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<LotteryState>({
    pastLotteries: [],
    currentQueue: [],
    upcomingLotteries: [],
    selectedLottery: null,
    isWheelSpinning: false,
  });

  useEffect(() => {
    // Mock data for demonstration
    const mockPastLotteries: PastLottery[] = [
      {
        id: 1,
        date: '2024-03-15',
        participants: 10,
        winner: '034e...0617',
        prize: 1000,
      },
      {
        id: 2,
        date: '2024-03-14',
        participants: 8,
        winner: '1a2b...3c4d',
        prize: 800,
      },
      {
        id: 3,
        date: '2024-03-13',
        participants: 12,
        winner: '5e6f...7g8h',
        prize: 1200,
      },
    ];

    const mockUpcomingLotteries: PastLottery[] = [
      {
        id: 4,
        date: '2024-03-16',
        participants: 15,
        winner: '',
        prize: 1500,
      },
      {
        id: 5,
        date: '2024-03-17',
        participants: 0,
        winner: '',
        prize: 0,
      },
    ];

    const mockCurrentQueue = [
      '034e...0617',
      '1a2b...3c4d',
      '5e6f...7g8h',
      '9i0j...1k2l',
      '3m4n...5o6p',
    ];

    setState(prev => ({
      ...prev,
      pastLotteries: mockPastLotteries,
      currentQueue: mockCurrentQueue,
      upcomingLotteries: mockUpcomingLotteries,
    }));
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
              {state.currentQueue.map((player, index) => (
                <div key={index} className="queue-slot">
                  <span className="slot-number">Slot {index + 1}</span>
                  <span className="slot-player">{player}</span>
                </div>
              ))}
            </div>
            <div className="queue-status">
              {state.currentQueue.length > 0 ? (
                <button className="draw-button" onClick={handleDraw}>
                  DRAW WINNER
                </button>
              ) : (
                <p>Queue is empty</p>
              )}
            </div>
          </div>

          {/* Upcoming Lotteries Section */}
          <div className="upcoming-lotteries-section">
            <h2>UPCOMING LOTTERIES</h2>
            <div className="lottery-list">
              {state.upcomingLotteries.map(lottery => (
                <div key={lottery.id} className="lottery-card">
                  <div className="lottery-info">
                    <span>Date: {lottery.date}</span>
                    <span>Participants: {lottery.participants}</span>
                    <span>Prize: {lottery.prize} BSV</span>
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
              {state.pastLotteries.map(lottery => (
                <div key={lottery.id} className="lottery-card">
                  <div className="lottery-info">
                    <span>Date: {lottery.date}</span>
                    <span>Participants: {lottery.participants}</span>
                    <span>Winner: {lottery.winner}</span>
                    <span>Prize: {lottery.prize} BSV</span>
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
                    {Array.from({ length: state.selectedLottery?.participants || 0 }).map((_, index) => (
                      <div
                        key={index}
                        className={`wheel-segment ${
                          index === 0 ? 'winner' : ''
                        }`}
                        style={{
                          transform: `rotate(${(360 / (state.selectedLottery?.participants || 1)) * index}deg)`,
                        }}
                      >
                        {index === 0 ? state.selectedLottery?.winner : `Player ${index + 1}`}
                      </div>
                    ))}
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