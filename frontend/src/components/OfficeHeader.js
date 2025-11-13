import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { logout } from '../services/authService';
import Icon from './Icon';
import './OfficeHeader.css';

const OfficeHeader = ({ onOpenDrawer }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { coachProfile, coachingBias, teamState, toggleCoachK, setCoachProfile } = useApp();

  // Determine active module based on route
  const getActiveModule = () => {
    const path = location.pathname;
    if (path.includes('/player-iq')) return 'Player IQ™';
    if (path.includes('/team-iq')) return 'Team IQ™ · Roster';
    if (path.includes('/recruiting-iq')) return 'Recruiting IQ™';
    if (path.includes('/office')) return 'Office';
    return 'Office';
  };

  const activeModule = getActiveModule();
  const isActiveTab = (path) => location.pathname.includes(path);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      setCoachProfile(null);
      navigate('/login');
    }
  };

  return (
    <header className="office-header">
      {/* Layer 1 - Primary Navigation */}
      <div className="header-layer-1">
        <div className="header-left">
          <div className="logo" onClick={() => navigate('/office')}>
            <span className="logo-text">KaNeXT IQ™</span>
          </div>
          <span className="active-module">{activeModule}</span>
        </div>

        <div className="header-center">
          <button 
            className={`quick-tab ${isActiveTab('/player-iq') ? 'active' : ''}`} 
            onClick={() => navigate('/player-iq')}
          >
            <span>Player IQ™</span>
          </button>
          <button 
            className={`quick-tab ${isActiveTab('/team-iq') ? 'active' : ''}`} 
            onClick={() => navigate('/team-iq')}
          >
            <span>Team IQ™</span>
          </button>
          <button 
            className={`quick-tab ${isActiveTab('/recruiting-iq') ? 'active' : ''}`} 
            onClick={() => navigate('/recruiting-iq')}
          >
            <span>Recruiting IQ™</span>
          </button>
          <button 
            className={`quick-tab ${isActiveTab('/coaching-iq') ? 'active' : ''}`} 
            onClick={onOpenDrawer}
          >
            <span>Coaching IQ™</span>
          </button>
        </div>

        <div className="header-right">
          <button 
            className="icon-btn" 
            title="Chat with Coach K™"
            onClick={toggleCoachK}
          >
            🤖
          </button>
          <button 
            className="icon-btn" 
            title="Coaching IQ™"
            onClick={onOpenDrawer}
          >
            🧠
          </button>
          <button 
            className="icon-btn" 
            title="Settings"
            onClick={() => {}}
          >
            ⚙️
          </button>
          <button 
            className="icon-btn" 
            title="Help"
            onClick={() => {}}
          >
            ❔
          </button>
          <button 
            className="icon-btn logout-btn" 
            title="Logout"
            onClick={handleLogout}
          >
            🚪
          </button>
        </div>
      </div>

      {/* Layer 2 - Context Strip */}
      <div className="header-layer-2">
        <span 
          className="context-item clickable" 
          onClick={() => navigate('/team-iq')}
          title="Go to Team IQ™"
        >
          Team: {coachProfile?.team || 'Not Set'}
        </span>
        <span className="context-divider">·</span>
        <span 
          className="context-item clickable" 
          onClick={onOpenDrawer}
          title="Open Coaching IQ™"
        >
          Offense: {coachingBias?.offensiveSystem || coachProfile?.offense || 'Not Set'}
        </span>
        <span className="context-divider">·</span>
        <span 
          className="context-item clickable" 
          onClick={onOpenDrawer}
          title="Open Coaching IQ™"
        >
          Defense: {coachingBias?.defensiveSystem || coachProfile?.defense || 'Not Set'}
        </span>
        <span className="context-divider">·</span>
        <span 
          className="context-item clickable" 
          onClick={() => navigate('/team-iq')}
          title="Go to Roster"
        >
          Roster: {teamState?.roster?.length || 0} Players
        </span>
        <span className="context-divider">·</span>
        <span 
          className="context-item clickable" 
          onClick={() => window.location.reload()}
          title="Refresh Data"
        >
          Last Sync: Now
        </span>
      </div>
    </header>
  );
};

export default OfficeHeader;

