import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { isAuthenticated } from '../services/authService';
import OfficeHeader from '../components/OfficeHeader';
import CoachingIQDrawer from '../components/CoachingIQDrawer';
import ModulePanels from '../components/ModulePanels';
import CoachKAssistant from '../components/CoachKAssistant';
import './OfficePage.css';

const OfficePage = () => {
  const navigate = useNavigate();
  const { coachProfile, coachingBias, setCoachKState } = useApp();
  const [showDrawer, setShowDrawer] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Strict check: must have valid authentication token
    if (!isAuthenticated() || !coachProfile) {
      navigate('/login');
      return;
    }

    setTimeout(() => setFadeIn(true), 100);

    // Auto-open Coach K on first visit
    setTimeout(() => {
      setCoachKState(prev => ({ 
        ...prev, 
        isOpen: true, 
        isMinimized: false,
        currentStage: prev.currentStage === 'welcome' ? 'stage1' : prev.currentStage
      }));
    }, 500);

    // Listen for Coaching IQ drawer open event
    const handleOpenDrawer = () => {
      setShowDrawer(true);
    };

    window.addEventListener('openCoachingIQDrawer', handleOpenDrawer);

    return () => {
      window.removeEventListener('openCoachingIQDrawer', handleOpenDrawer);
    };
  }, [coachProfile, coachingBias, navigate, setCoachKState]);

  if (!coachProfile) {
    return null;
  }

  return (
    <div className={`office-page ${fadeIn ? 'fade-in' : ''}`}>
      <OfficeHeader onOpenDrawer={() => setShowDrawer(true)} />
      
      <div className="office-content">
        <ModulePanels />
        
        <div className="office-footer">
          <span>Powered by KaNeXT IQ™</span>
          <span className="divider">·</span>
          <span className="coach-k-status">Assistant: Coach K™ Active</span>
        </div>
      </div>

      <CoachingIQDrawer 
        isOpen={showDrawer} 
        onClose={() => setShowDrawer(false)} 
      />

      <CoachKAssistant />
    </div>
  );
};

export default OfficePage;

