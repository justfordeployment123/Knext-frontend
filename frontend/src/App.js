import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AboutPage from './pages/AboutPage';
import OfficePage from './pages/OfficePage';
import PlayerIQPage from './pages/PlayerIQPage';
import TeamIQPage from './pages/TeamIQPage';
import RecruitingIQPage from './pages/RecruitingIQPage';
import PrediXtPage from './pages/PrediXtPage';
import ProtectedRoute from './components/ProtectedRoute';
import { AppProvider } from './context/AppContext';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route 
            path="/office" 
            element={
              <ProtectedRoute>
                <OfficePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/player-iq" 
            element={
              <ProtectedRoute>
                <PlayerIQPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/team-iq" 
            element={
              <ProtectedRoute>
                <TeamIQPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/recruiting-iq" 
            element={
              <ProtectedRoute>
                <RecruitingIQPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/predixt" 
            element={
              <ProtectedRoute>
                <PrediXtPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;

