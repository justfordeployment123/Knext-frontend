import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, isAuthenticated } from '../services/authService';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Initialize coach profile ONLY from valid token - no localStorage fallback
  const initializeProfile = () => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      if (user) {
        return {
          name: user.fullName,
          email: user.email,
          team: user.teamName,
          division: user.division,
          offense: user.offensiveSystem,
          defense: user.defensiveSystem
        };
      }
    }
    // No fallback - must have valid token
    return null;
  };

  // Coach Profile State
  const [coachProfile, setCoachProfile] = useState(initializeProfile);

  // Coaching IQ / Bias State
  const [coachingBias, setCoachingBias] = useState(() => {
    const saved = localStorage.getItem('coachingBias');
    return saved ? JSON.parse(saved) : null;
  });

  // Team State
  const [teamState, setTeamState] = useState(() => {
    const saved = localStorage.getItem('teamState');
    return saved ? JSON.parse(saved) : {
      roster: [],
      teamKPI: 0,
      systemFit: 0,
      confidenceAvg: 0,
      scholarshipUsed: 0,
      nilUtilized: 0
    };
  });

  // Player Profiles
  const [playerProfiles, setPlayerProfiles] = useState(() => {
    const saved = localStorage.getItem('playerProfiles');
    return saved ? JSON.parse(saved) : [];
  });

  // Recruiting State
  const [recruitingState, setRecruitingState] = useState(() => {
    const saved = localStorage.getItem('recruitingState');
    return saved ? JSON.parse(saved) : {
      activeRecruits: [],
      priorityRecruits: [],
      committedCount: 0
    };
  });

  // Coach K Assistant State
  const [coachKState, setCoachKState] = useState({
    isOpen: false,
    isMinimized: false,
    messages: [],
    currentStage: 'welcome'
  });

  // Cleanup stale data and sync profile with token on mount
  useEffect(() => {
    // Clear all data if no valid token exists
    if (!isAuthenticated()) {
      localStorage.removeItem('coachProfile');
      localStorage.removeItem('authToken');
      setCoachProfile(null);
      return;
    }

    // Sync profile from valid token
    if (isAuthenticated() && !coachProfile) {
      const user = getCurrentUser();
      if (user) {
        setCoachProfile({
          name: user.fullName,
          email: user.email,
          team: user.teamName,
          division: user.division,
          offense: user.offensiveSystem,
          defense: user.defensiveSystem
        });
      } else {
        // Token exists but user data is invalid - clear everything
        localStorage.removeItem('coachProfile');
        localStorage.removeItem('authToken');
        setCoachProfile(null);
      }
    }
  }, []);

  // Persist to localStorage only if authenticated
  useEffect(() => {
    if (coachProfile && isAuthenticated()) {
      localStorage.setItem('coachProfile', JSON.stringify(coachProfile));
    } else if (!isAuthenticated()) {
      // Clear profile if not authenticated
      localStorage.removeItem('coachProfile');
    }
  }, [coachProfile]);

  useEffect(() => {
    if (coachingBias) {
      localStorage.setItem('coachingBias', JSON.stringify(coachingBias));
    }
  }, [coachingBias]);

  useEffect(() => {
    localStorage.setItem('teamState', JSON.stringify(teamState));
  }, [teamState]);

  useEffect(() => {
    localStorage.setItem('playerProfiles', JSON.stringify(playerProfiles));
  }, [playerProfiles]);

  useEffect(() => {
    localStorage.setItem('recruitingState', JSON.stringify(recruitingState));
  }, [recruitingState]);

  // Helper Functions
  const addPlayerProfile = (player) => {
    setPlayerProfiles(prev => [...prev, { ...player, id: Date.now().toString() }]);
  };

  const updatePlayerProfile = (id, updates) => {
    setPlayerProfiles(prev => 
      prev.map(player => player.id === id ? { ...player, ...updates } : player)
    );
  };

  const addToRoster = (player) => {
    setTeamState(prev => ({
      ...prev,
      roster: [...prev.roster, player]
    }));
  };

  const updateCoachingBias = (bias) => {
    setCoachingBias(bias);
  };

  const addCoachKMessage = (message) => {
    setCoachKState(prev => ({
      ...prev,
      messages: [...prev.messages, { ...message, timestamp: Date.now() }]
    }));
  };

  const toggleCoachK = () => {
    setCoachKState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  };

  const minimizeCoachK = () => {
    setCoachKState(prev => ({ ...prev, isMinimized: true, isOpen: false }));
  };

  const value = {
    coachProfile,
    setCoachProfile,
    coachingBias,
    setCoachingBias,
    updateCoachingBias,
    teamState,
    setTeamState,
    playerProfiles,
    setPlayerProfiles,
    addPlayerProfile,
    updatePlayerProfile,
    addToRoster,
    recruitingState,
    setRecruitingState,
    coachKState,
    setCoachKState,
    addCoachKMessage,
    toggleCoachK,
    minimizeCoachK
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

