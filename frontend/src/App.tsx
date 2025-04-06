import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import GameWrapper from './components/GameWrapper';
import Leaderboard from './components/Leaderboard';
import Lottery from './components/Lottery';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game" element={<GameWrapper />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/lottery" element={<Lottery />} />
      </Routes>
    </Router>
  );
};

export default App; 