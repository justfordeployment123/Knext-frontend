import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { isAuthenticated } from '../services/authService';
import CoachingIQDrawer from '../components/CoachingIQDrawer';
import CoachKReactionPanel from '../components/CoachKReactionPanel';
import './TeamIQPage.css';

const TeamIQPage = () => {
  const navigate = useNavigate();
  const { coachProfile, coachingBias, teamState, setTeamState, addCoachKMessage } = useApp();
  
  const [activeView, setActiveView] = useState('roster'); // roster or depth
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [expandedPlayerTab, setExpandedPlayerTab] = useState('kpi'); // kpi, financial, performance, notes
  const [draggedPlayer, setDraggedPlayer] = useState(null);
  const [depthChartState, setDepthChartState] = useState({}); // Sandbox state for depth chart
  const [showTeamEvaluation, setShowTeamEvaluation] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [editingFinancial, setEditingFinancial] = useState(null); // { playerId, field: 'scholarship' | 'nil' }
  const [tempFinancialValue, setTempFinancialValue] = useState('');
  const [sandboxMetrics, setSandboxMetrics] = useState(null); // Metrics for sandbox lineup
  const [dragOverPosition, setDragOverPosition] = useState(null);
  const [teamMetrics, setTeamMetrics] = useState({
    teamKPI: 0,
    teamKPIBand: 'F',
    systemFit: 0,
    scholarshipUsage: 0,
    scholarshipSlots: 0,
    nilUtilized: 0,
    confidenceAvg: 0
  });
  const [showRecruitingModal, setShowRecruitingModal] = useState(false);

  // Calculate Team KPI Band (A-F)
  const getTeamKPIBand = (kpi) => {
    if (kpi >= 90) return 'A';
    if (kpi >= 80) return 'B';
    if (kpi >= 70) return 'C';
    if (kpi >= 60) return 'D';
    return 'F';
  };

  useEffect(() => {
    // Calculate team metrics
    if (teamState.roster && teamState.roster.length > 0) {
      const avgKPI = teamState.roster.reduce((sum, p) => sum + (p.final_kpi || p.kpi || 0), 0) / teamState.roster.length;
      const avgFit = teamState.roster.reduce((sum, p) => sum + (p.fit || 0), 0) / teamState.roster.length;
      const avgConf = teamState.roster.reduce((sum, p) => sum + (p.confidence || 0), 0) / teamState.roster.length;
      
      // Count scholarship slots (players with scholarship > 0)
      const scholarshipSlots = teamState.roster.filter(p => parseFloat(p.scholarship_suggestion || p.scholarship || 0) > 0).length;
      const scholarshipCap = coachingBias?.scholarshipCap || 12;
      
      const totalNIL = teamState.roster.reduce((sum, p) => sum + parseFloat(p.nil_value_suggestion || p.nil || 0), 0);
      const maxNIL = coachingBias?.nilPool || 50000;

      setTeamMetrics({
        teamKPI: parseFloat(avgKPI.toFixed(1)),
        teamKPIBand: getTeamKPIBand(avgKPI),
        systemFit: Math.round(avgFit),
        scholarshipUsage: scholarshipSlots,
        scholarshipSlots: scholarshipSlots,
        nilUtilized: Math.round((totalNIL / maxNIL) * 100),
        confidenceAvg: Math.round(avgConf)
      });
    } else {
      setTeamMetrics({
        teamKPI: 0,
        teamKPIBand: 'F',
        systemFit: 0,
        scholarshipUsage: 0,
        scholarshipSlots: 0,
        nilUtilized: 0,
        confidenceAvg: 0
      });
    }
  }, [teamState.roster, coachingBias]);

  const handleRemovePlayer = (playerId) => {
    if (window.confirm('Remove this player from roster?')) {
      console.log('[LOGIC HOOK: handleRemovePlayer] Removing player:', playerId);
      setTeamState(prev => ({
        ...prev,
        roster: prev.roster.filter(p => p.id !== playerId)
      }));
      setSelectedPlayer(null);
    }
  };

  const handleSavePlayerChanges = () => {
    if (selectedPlayer) {
      console.log('[LOGIC HOOK: handleSavePlayerChanges] Saving changes for player:', selectedPlayer);
      setTeamState(prev => ({
        ...prev,
        roster: prev.roster.map(p => p.id === selectedPlayer.id ? selectedPlayer : p)
      }));
      
      // Recalculate financial summary
      const totalScholarship = teamState.roster.reduce((sum, p) => {
        const playerScholarship = p.id === selectedPlayer.id 
          ? parseFloat(selectedPlayer.scholarship_slot || selectedPlayer.scholarship || 0)
          : parseFloat(p.scholarship_slot || p.scholarship || 0);
        return sum + playerScholarship;
      }, 0);
      
      const totalNIL = teamState.roster.reduce((sum, p) => {
        const playerNIL = p.id === selectedPlayer.id
          ? parseFloat(selectedPlayer.nil_value_suggestion || selectedPlayer.nil || 0)
          : parseFloat(p.nil_value_suggestion || p.nil || 0);
        return sum + playerNIL;
      }, 0);
      
      alert('✅ Player changes saved');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFinancialClick = (e, player, field) => {
    e.stopPropagation();
    setEditingFinancial({ playerId: player.id, field });
    if (field === 'scholarship') {
      setTempFinancialValue(player.scholarship_slot || player.scholarship || '0.0');
    } else {
      setTempFinancialValue(player.nil_value_suggestion || player.nil || '0');
    }
  };

  const handleFinancialSave = (playerId, field) => {
    const currentRoster = teamState.roster && teamState.roster.length > 0 ? teamState.roster : sampleRoster;
    const player = currentRoster.find(p => p.id === playerId);
    if (!player) return;

    const updatedPlayer = { ...player };
    if (field === 'scholarship') {
      const value = parseFloat(tempFinancialValue) || 0;
      updatedPlayer.scholarship_slot = Math.min(Math.max(value, 0), 1.0);
      updatedPlayer.scholarship = updatedPlayer.scholarship_slot * (coachingBias?.scholarshipCap || 12) * 10000;
    } else {
      updatedPlayer.nil_value_suggestion = parseFloat(tempFinancialValue) || 0;
      updatedPlayer.nil = updatedPlayer.nil_value_suggestion;
    }

    setTeamState(prev => ({
      ...prev,
      roster: prev.roster.map(p => p.id === playerId ? updatedPlayer : p)
    }));

    // Recalculate and show Coach K™ tip if near scholarship cap
    const totalSlots = teamState.roster.reduce((sum, p) => {
      const slot = p.id === playerId 
        ? updatedPlayer.scholarship_slot 
        : parseFloat(p.scholarship_slot || (p.scholarship ? p.scholarship / ((coachingBias?.scholarshipCap || 12) * 10000) : 0));
      return sum + slot;
    }, 0);
    
    const scholarshipCap = coachingBias?.scholarshipCap || 12;
    const nearCap = totalSlots >= scholarshipCap * 0.9;
    
    if (nearCap) {
      setTimeout(() => {
        addCoachKMessage({
          id: 'TIQ_FINANCIAL_TIP',
          speaker: 'Coach K',
          message: `You're near your scholarship cap — reallocating here affects your financial summary.`,
          type: 'warning'
        });
      }, 500);
    }

    // Dispatch financial edit event for Coach K™
    window.dispatchEvent(new CustomEvent('teamFinancialEdit', {
      detail: {
        field: field,
        nearCap: nearCap
      }
    }));

    setEditingFinancial(null);
    setTempFinancialValue('');
  };

  const handleFinancialCancel = () => {
    setEditingFinancial(null);
    setTempFinancialValue('');
  };

  const handleViewInPlayerIQ = () => {
    if (selectedPlayer) {
      navigate('/player-iq', { state: { playerData: selectedPlayer } });
    }
  };

  const handleRemoveToRecruiting = () => {
    if (selectedPlayer && window.confirm(`Move ${selectedPlayer.name} to Recruiting Board (Released)?`)) {
      console.log('[LOGIC HOOK: handleRemoveToRecruiting] Moving player to Recruiting Board:', selectedPlayer.id);
      
      // Dispatch roster change event for Coach K™
      window.dispatchEvent(new CustomEvent('teamRosterChange', {
        detail: {
          trigger: 'roster_remove',
          context: {
            playerName: selectedPlayer.name,
            playerId: selectedPlayer.id
          }
        }
      }));
      
      setTeamState(prev => ({
        ...prev,
        roster: prev.roster.filter(p => p.id !== selectedPlayer.id)
      }));
      setSelectedPlayer(null);
      alert(`✅ ${selectedPlayer.name} moved to Recruiting Board`);
    }
  };

  // Sample data for Phase 1 demonstration
  const sampleRoster = teamState.roster && teamState.roster.length > 0 
    ? teamState.roster 
    : [
        { id: '1', name: 'J. Murray', position: 'PG', age: 24, kpi: 85, fit: 81, confidence: 84, scholarship: 12000, nil: 7200, eligibility: 'Active', flags: [] },
        { id: '2', name: 'M. Johnson', position: 'SG', age: 22, kpi: 78, fit: 75, confidence: 82, scholarship: 10000, nil: 5400, eligibility: 'Active', flags: [] },
        { id: '3', name: 'T. Williams', position: 'SF', age: 21, kpi: 82, fit: 88, confidence: 79, scholarship: 11000, nil: 6800, eligibility: 'Active', flags: [] },
        { id: '4', name: 'C. Davis', position: 'PF', age: 23, kpi: 76, fit: 72, confidence: 77, scholarship: 9500, nil: 4800, eligibility: 'Active', flags: [] }
      ];

  const displayRoster = teamState.roster && teamState.roster.length > 0 ? teamState.roster : sampleRoster;

  // Sort roster based on sortConfig
  const sortedRoster = [...displayRoster].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let aValue, bValue;
    switch (sortConfig.key) {
      case 'kpi':
        aValue = a.final_kpi || a.kpi || 0;
        bValue = b.final_kpi || b.kpi || 0;
        break;
      case 'fit':
        aValue = a.fit || 0;
        bValue = b.fit || 0;
        break;
      case 'confidence':
        aValue = a.confidence || 0;
        bValue = b.confidence || 0;
        break;
      case 'scholarship':
        aValue = parseFloat(a.scholarship_slot || a.scholarship || 0);
        bValue = parseFloat(b.scholarship_slot || b.scholarship || 0);
        break;
      default:
        return 0;
    }

    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Recalculate team metrics for sandbox lineup
  const recalcSandboxMetrics = (lineupState) => {
    const allPlayers = Object.values(lineupState).flat();
    if (allPlayers.length === 0) {
      setSandboxMetrics(null);
      return;
    }

    const avgKPI = allPlayers.reduce((sum, p) => sum + (p.final_kpi || p.kpi || 0), 0) / allPlayers.length;
    const avgFit = allPlayers.reduce((sum, p) => sum + (p.fit || 0), 0) / allPlayers.length;
    const avgConf = allPlayers.reduce((sum, p) => sum + (p.confidence || 0), 0) / allPlayers.length;

    const newMetrics = {
      teamKPI: parseFloat(avgKPI.toFixed(1)),
      teamKPIBand: getTeamKPIBand(avgKPI),
      systemFit: Math.round(avgFit),
      confidenceAvg: Math.round(avgConf)
    };

    setSandboxMetrics(newMetrics);

    // Update header summary if sandbox is active
    if (Object.keys(lineupState).length > 0) {
      const deltaKPI = newMetrics.teamKPI - teamMetrics.teamKPI;
      if (Math.abs(deltaKPI) > 0.1) {
        setTimeout(() => {
          addCoachKMessage({
            id: 'TIQ_DEPTH_CHART_UPDATE',
            speaker: 'Coach K',
            message: `Roster adjusted — Team KPI ${deltaKPI >= 0 ? '+' : ''}${deltaKPI.toFixed(1)}.`,
            type: 'info'
          });
        }, 300);
      }
    }
  };

  const handleDragStart = (e, player, currentPosition) => {
    setDraggedPlayer({ player, currentPosition });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', player.id);
  };

  const handleDragOver = (e, position) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverPosition(position);
  };

  const handleDragLeave = () => {
    setDragOverPosition(null);
  };

  const handleDrop = (e, targetPosition) => {
    e.preventDefault();
    setDragOverPosition(null);
    
    if (draggedPlayer) {
      const { player, currentPosition } = draggedPlayer;
      
      console.log('[LOGIC HOOK: handleDrop] Moving player to position:', {
        playerId: player.id,
        playerName: player.name,
        from: currentPosition,
        to: targetPosition
      });

      // Remove from current position
      const newState = { ...depthChartState };
      if (currentPosition && newState[currentPosition]) {
        newState[currentPosition] = newState[currentPosition].filter(p => p.id !== player.id);
      }

      // Add to target position
      if (!newState[targetPosition]) {
        newState[targetPosition] = [];
      }
      newState[targetPosition] = [...newState[targetPosition], player];

      setDepthChartState(newState);
      recalcSandboxMetrics(newState);
      
      // Dispatch depth swap event for Coach K™
      window.dispatchEvent(new CustomEvent('teamDepthSwap', {
        detail: {
          fromPosition: currentPosition,
          toPosition: targetPosition,
          playerName: player.name
        }
      }));
      
      setDraggedPlayer(null);
    }
  };

  const getPlayersForPosition = (position) => {
    // Get players from sandbox state or roster
    if (depthChartState[position] && depthChartState[position].length > 0) {
      return depthChartState[position];
    }
    
    // Fallback to roster players matching position
    return displayRoster.filter(p => {
      if (position === 'PG') return p.position === 'PG';
      if (position === 'CG') return p.position === 'SG';
      if (position === 'Wing') return p.position === 'SF' || p.position === 'SG';
      if (position === 'Forward') return p.position === 'PF' || p.position === 'SF';
      if (position === 'Big') return p.position === 'C' || p.position === 'PF';
      return false;
    });
  };

  const getBenchPlayers = (position) => {
    const primaryPlayers = getPlayersForPosition(position);
    const allPositionPlayers = displayRoster.filter(p => {
      if (position === 'PG') return p.position === 'PG';
      if (position === 'CG') return p.position === 'SG';
      if (position === 'Wing') return p.position === 'SF' || p.position === 'SG';
      if (position === 'Forward') return p.position === 'PF' || p.position === 'SF';
      if (position === 'Big') return p.position === 'C' || p.position === 'PF';
      return false;
    }).sort((a, b) => (b.fit || 0) - (a.fit || 0));

    // Return up to 3 bench players (excluding primary)
    const primaryIds = primaryPlayers.map(p => p.id);
    return allPositionPlayers
      .filter(p => !primaryIds.includes(p.id))
      .slice(0, 3);
  };

  const calculatePositionWeight = (position, lineupState) => {
    const players = lineupState[position] || [];
    if (players.length === 0) return 0;
    
    const totalKPI = players.reduce((sum, p) => sum + (p.final_kpi || p.kpi || 0), 0);
    const allPlayers = Object.values(lineupState).flat();
    const totalTeamKPI = allPlayers.reduce((sum, p) => sum + (p.final_kpi || p.kpi || 0), 0);
    
    if (totalTeamKPI === 0) return 0;
    return (totalKPI / totalTeamKPI) * 100;
  };

  const generateTeamReport = () => {
    const currentMetrics = sandboxMetrics || teamMetrics;
    const lineupPlayers = Object.values(depthChartState).flat().length > 0 
      ? Object.values(depthChartState).flat()
      : displayRoster;

    // Generate narrative summary based on metrics
    const tier = currentMetrics.teamKPI >= 80 ? 'Contender' : currentMetrics.teamKPI >= 70 ? 'Competitive' : 'Building';
    const summary = `Balanced roster built around guard play and perimeter spacing. Elite shooting; limited rim protection and defensive rebounding below divisional average. ${tier === 'Contender' ? 'Tournament-caliber but undersized against physical teams.' : 'Needs depth to compete at highest level.'}`;

    const coachKComment = currentMetrics.systemFit >= 80 
      ? `Offense grades Top-15 for your level — defense still mid-tier. Add a rim protector to contend.`
      : `System alignment at ${currentMetrics.systemFit}% — consider adjusting Coaching IQ weights or adding position-specific talent.`;

    const improvementPath = `Add forward ≥ 82 KPI · boost defensive cluster +5 · shift bias +3 toward defense.`;

    const scholarshipSlots = teamMetrics.scholarshipSlots;
    const scholarshipCap = coachingBias?.scholarshipCap || 12;
    const remainingSlots = scholarshipCap - scholarshipSlots;
    const remainingBudget = (remainingSlots * 10000).toLocaleString();
    const nilUtilized = teamMetrics.nilUtilized;
    const nilUnused = 100 - nilUtilized;

    return {
      division: coachProfile?.division || 'USCAA',
      teamKPI: currentMetrics.teamKPI,
      fitPercent: currentMetrics.systemFit,
      confidenceAvg: currentMetrics.confidenceAvg,
      tier: tier,
      summary: summary,
      coachKComment: coachKComment,
      improvementPath: improvementPath,
      resources: {
        scholarshipSlots: `${remainingSlots.toFixed(1)} scholarship slots`,
        budget: `$${remainingBudget} budget`,
        nilUnused: `${nilUnused}% NIL pool unused`
      }
    };
  };

  const handleEvaluateTeam = () => {
    console.log('[LOGIC HOOK: handleEvaluateTeam] Running team evaluation');
    setShowTeamEvaluation(true);
  };

  const handleRunPrediXt = () => {
    const lineupPlayers = Object.values(depthChartState).flat().length > 0 
      ? Object.values(depthChartState).flat()
      : displayRoster;
    
    console.log('[LOGIC HOOK: handleRunPrediXt] Running PrediXt with current lineup:', lineupPlayers);
    
    addCoachKMessage({
      id: 'TIQ_PREDIXT_START',
      speaker: 'Coach K',
      message: 'Opening PrediXt workspace with current lineup...',
      type: 'info'
    });

    // Dispatch PrediXt run event for Coach K™
    window.dispatchEvent(new CustomEvent('teamPrediXtRun', {
      detail: {
        sandbox: true,
        playerCount: lineupPlayers.length,
        simulationType: 'single'
      }
    }));
    
    navigate('/predixt', { state: { lineup: lineupPlayers, sandbox: true } });
  };

  const handleRunSeasonProjection = () => {
    const lineupPlayers = Object.values(depthChartState).flat().length > 0 
      ? Object.values(depthChartState).flat()
      : displayRoster;
    
    console.log('[LOGIC HOOK: handleRunSeasonProjection] Running season projection:', lineupPlayers);
    
    addCoachKMessage({
      id: 'TIQ_SEASON_PROJECTION',
      speaker: 'Coach K',
      message: 'Scenario projection running — using sandbox lineup.',
      type: 'info'
    });

    // Dispatch scenario projection event for Coach K™
    window.dispatchEvent(new CustomEvent('teamPrediXtRun', {
      detail: {
        sandbox: true,
        playerCount: lineupPlayers.length,
        simulationType: 'scenario',
        winProb: 65, // Mock data
        opponent: 'UNLV' // Mock data
      }
    }));
    
    // TODO: Open PrediXt Scenario Projection overlay
    alert('Season Projection feature coming soon. This will run a full-season simulation using the sandbox roster.');
  };

  const handleApplyToRoster = () => {
    if (Object.keys(depthChartState).length === 0) {
      alert('No changes to apply. Make lineup adjustments first.');
      return;
    }

    if (window.confirm('Apply current sandbox lineup as official roster? This will lock the roster and sync across all modules.')) {
      const lineupPlayers = Object.values(depthChartState).flat();
      
      console.log('[LOGIC HOOK: handleApplyToRoster] Applying sandbox lineup to roster:', lineupPlayers);
      
      setTeamState(prev => ({
        ...prev,
        roster: lineupPlayers
      }));

      // Clear sandbox state
      setDepthChartState({});
      setSandboxMetrics(null);

      addCoachKMessage({
        id: 'TIQ_ROSTER_LOCKED',
        speaker: 'Coach K',
        message: 'Roster locked · PrediXt engine will refresh overnight.',
        type: 'success'
      });

      // Dispatch roster apply event for Coach K™
      window.dispatchEvent(new CustomEvent('teamRosterApply'));

    alert('✅ Lineup applied to roster');
    }
  };

  const handleShowMatchingRecruits = () => {
    const report = generateTeamReport();
    // Navigate to Recruiting IQ with filters for needed roles
    navigate('/recruiting-iq', { 
      state: { 
        filters: { 
          minKPI: 82,
          position: 'PF',
          needs: 'rim protection'
        }
      }
    });
  };

  const handleSaveReport = () => {
    const report = generateTeamReport();
    console.log('[LOGIC HOOK: handleSaveReport] Saving team evaluation:', report);
    
    // TODO: Write team_evaluation object to DB
    alert('✅ Team evaluation report saved');
    setShowTeamEvaluation(false);
  };

  // Simple direct handlers - no useCallback to avoid any closure issues
  const handleViewChange = (view) => {
    console.log('[LOGIC HOOK] Switching view to:', view, 'current:', activeView);
    if (activeView !== view) {
      setActiveView(view);
    }
  };

  useEffect(() => {
    if (!isAuthenticated() || !coachProfile) {
      navigate('/login');
      return;
    }

    // Listen for Coaching IQ drawer open event
    const handleOpenDrawer = () => {
      setShowDrawer(true);
    };

    window.addEventListener('openCoachingIQDrawer', handleOpenDrawer);

    return () => {
      window.removeEventListener('openCoachingIQDrawer', handleOpenDrawer);
    };
  }, [navigate, coachProfile]);

  const handleContextClick = (field) => {
    if (field === 'system') {
      const event = new CustomEvent('openCoachingIQDrawer');
      window.dispatchEvent(event);
      setShowDrawer(true);
    } else if (field === 'roster') {
      // Scroll to roster table or ensure roster view is active
      setActiveView('roster');
    }
  };

  if (!isAuthenticated() || !coachProfile) {
    return null;
  }

  return (
    <div className="team-iq-page">
      {/* Fixed Dual-Strip Header */}
      <header className="team-iq-header">
        {/* Main Header Bar (80px) */}
        <div className="header-main-bar">
          {/* Left Zone - Module Identity & Context */}
          <div className="header-left">
            <h1 className="header-title">TEAM IQ™ DASHBOARD</h1>
            <p className="header-subtitle">Aggregate roster intelligence · system readiness · resource balance.</p>
            <div className="context-line">
              <span 
                className="context-field clickable" 
                onClick={() => handleContextClick('team')}
                title="Team Profile"
              >
                Team: {coachProfile?.team || 'Not Set'}
              </span>
              <span className="context-divider">·</span>
              <span 
                className="context-field clickable" 
                onClick={() => handleContextClick('division')}
                title="Division"
              >
                Division: {coachProfile?.division || 'Not Set'}
              </span>
              <span className="context-divider">·</span>
              <span 
                className="context-field clickable" 
                onClick={() => handleContextClick('system')}
                title="Open Coaching IQ™"
              >
                System: {coachingBias?.offensiveSystem || 'Not Set'} / {coachingBias?.defensiveSystem || 'Not Set'}
              </span>
              <span className="context-divider">·</span>
              <span 
                className="context-field clickable" 
                onClick={() => handleContextClick('roster')}
                title="View Roster"
              >
              Roster: {teamState.roster?.length || 0} Players
              </span>
            </div>
          </div>

          {/* Center Zone - View Tabs */}
          <div className="header-center">
            <div className="view-tabs">
              <button 
                type="button"
                className={`view-tab ${activeView === 'roster' ? 'active' : ''}`}
                onClick={() => handleViewChange('roster')}
              >
                Roster View
              </button>
              <button 
                type="button"
                className={`view-tab ${activeView === 'depth' ? 'active' : ''}`}
                onClick={() => handleViewChange('depth')}
              >
                Depth Chart View
              </button>
            </div>
          </div>

          {/* Right Zone - Global Actions */}
          <div className="header-right">
            <button 
              className="action-btn-icon" 
              onClick={() => {
                console.log('[LOGIC HOOK] Opening Coaching IQ Drawer from Team IQ header');
                const event = new CustomEvent('openCoachingIQDrawer');
                window.dispatchEvent(event);
                setShowDrawer(true);
              }}
              title="Open Coaching IQ™"
            >
              <span className="icon-emoji">🧠</span>
              <span className="action-label">Coaching IQ™</span>
            </button>
            <button 
              className="action-btn-icon" 
              onClick={() => {
                console.log('[LOGIC HOOK: handleAddFromRecruiting] Opening Add from Recruiting Board modal');
                setShowRecruitingModal(true);
              }}
              title="Add from Recruiting Board"
            >
              <span className="icon-emoji">📋</span>
              <span className="action-label">Add from Recruiting Board</span>
            </button>
            <button 
              className="action-btn-icon" 
              onClick={() => navigate('/office')}
              title="Return to Office"
            >
              <span className="icon-emoji">🏠</span>
              <span className="action-label">Return to Office</span>
            </button>
          </div>
        </div>

        {/* Summary Line (40px) */}
        <div className="summary-line">
          <div className="summary-item">
            <span className="summary-label">Team KPI:</span>
            <span 
              className={`summary-value kpi-band-${teamMetrics.teamKPIBand.toLowerCase()}`}
              title={`Off / Def / Core breakdown`}
            >
              {teamMetrics.teamKPI} ({teamMetrics.teamKPIBand}-Band)
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">System Fit %:</span>
            <span className="summary-value">{teamMetrics.systemFit}%</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Scholarship Usage:</span>
            <span className="summary-value">{teamMetrics.scholarshipSlots} / {coachingBias?.scholarshipCap || 12}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">NIL Pool Utilized %:</span>
            <span className="summary-value">{teamMetrics.nilUtilized}%</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Confidence Avg %:</span>
            <span className="summary-value">{teamMetrics.confidenceAvg}%</span>
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="team-iq-content" key={activeView}>
        {/* Roster View */}
        {activeView === 'roster' && (
          <div className="roster-view">
            <div className="roster-table-container">
              <table className="roster-table">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => handleSort('name')}>
                      Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>POS</th>
                    <th>AGE</th>
                    <th className="sortable" onClick={() => handleSort('kpi')}>
                      OVR (KPI) {sortConfig.key === 'kpi' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('fit')}>
                      FIT % {sortConfig.key === 'fit' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('confidence')}>
                      CONF % {sortConfig.key === 'confidence' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="sortable" onClick={() => handleSort('scholarship')}>
                      SCH ALLOT {sortConfig.key === 'scholarship' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>NIL VALUE ($)</th>
                    <th>ELIG.</th>
                    <th>FLAGS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRoster.map((player) => {
                    const isSelected = selectedPlayer?.id === player.id;
                    // Calculate scholarship slot (0.0-1.0) from dollar amount or use existing slot
                    let scholarshipSlot = player.scholarship_slot;
                    if (!scholarshipSlot && player.scholarship) {
                      const scholarshipCap = coachingBias?.scholarshipCap || 12;
                      const maxScholarship = scholarshipCap * 10000; // Max per player
                      scholarshipSlot = Math.min(parseFloat(player.scholarship) / maxScholarship, 1.0);
                    }
                    scholarshipSlot = scholarshipSlot || 0;
                    
                    const isEditingScholarship = editingFinancial?.playerId === player.id && editingFinancial?.field === 'scholarship';
                    const isEditingNIL = editingFinancial?.playerId === player.id && editingFinancial?.field === 'nil';
                    
                    return (
                      <tr 
                        key={player.id} 
                        className={isSelected ? 'selected' : ''}
                        onClick={() => setSelectedPlayer(player)}
                      >
                        <td className="player-name clickable">{player.name}</td>
                        <td>{player.position}</td>
                        <td>{player.age || 'N/A'}</td>
                        <td className="kpi-value">{player.final_kpi || player.kpi || 0}</td>
                        <td>{player.fit || 0}%</td>
                        <td>{player.confidence || 0}%</td>
                        <td 
                          className="financial-cell clickable"
                          onClick={(e) => handleFinancialClick(e, player, 'scholarship')}
                          title="Click to edit"
                        >
                          {isEditingScholarship ? (
                            <div className="inline-edit">
                              <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={tempFinancialValue}
                                onChange={(e) => setTempFinancialValue(e.target.value)}
                                onBlur={() => handleFinancialSave(player.id, 'scholarship')}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleFinancialSave(player.id, 'scholarship');
                                  } else if (e.key === 'Escape') {
                                    handleFinancialCancel();
                                  }
                                }}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          ) : (
                            scholarshipSlot.toFixed(1)
                          )}
                        </td>
                        <td 
                          className="financial-cell clickable"
                          onClick={(e) => handleFinancialClick(e, player, 'nil')}
                          title="Click to edit"
                        >
                          {isEditingNIL ? (
                            <div className="inline-edit">
                              <input
                                type="number"
                                min="0"
                                value={tempFinancialValue}
                                onChange={(e) => setTempFinancialValue(e.target.value)}
                                onBlur={() => handleFinancialSave(player.id, 'nil')}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleFinancialSave(player.id, 'nil');
                                  } else if (e.key === 'Escape') {
                                    handleFinancialCancel();
                                  }
                                }}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          ) : (
                            `$${(player.nil_value_suggestion || player.nil || 0).toLocaleString()}`
                          )}
                        </td>
                        <td>{player.eligibility || 'Active'}</td>
                        <td>{player.flags && player.flags.length > 0 ? '⚠️' : '—'}</td>
                        <td>
                          <div className="action-menu" onClick={(e) => e.stopPropagation()}>
                          <button 
                            type="button"
                              className="action-btn-menu"
                              onClick={() => setSelectedPlayer(player)}
                            >
                              ⋮
                          </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>

                {/* Expanded Player View */}
                {selectedPlayer && (
                  <div className="player-detail-panel slide-down">
                    {/* Header Bar */}
                    <div className="panel-header-bar">
                      <div className="player-header-info">
                        <div className="player-headshot">
                          {selectedPlayer.name.charAt(0)}
                        </div>
                        <div className="player-header-details">
                      <h3>{selectedPlayer.name}</h3>
                          <div className="player-header-meta">
                            <span className="meta-item">{selectedPlayer.position}</span>
                            <span className="meta-divider">·</span>
                            <span className="meta-item">Offensive Threat</span>
                            <span className="meta-divider">·</span>
                            <span className="meta-item">OVR {selectedPlayer.final_kpi || selectedPlayer.kpi || 0}</span>
                            <span className="meta-divider">|</span>
                            <span className="meta-item">Role: {selectedPlayer.roleProjection || (selectedPlayer.final_kpi > 80 ? 'Starter' : selectedPlayer.final_kpi > 70 ? 'Rotation' : 'Depth')}</span>
                            <span className="meta-divider">·</span>
                            <span className="meta-item">Fit {selectedPlayer.fit || 0}%</span>
                    </div>
                        </div>
                      </div>
                      <button className="panel-close" onClick={() => setSelectedPlayer(null)}>×</button>
                    </div>

                    {/* Tabs */}
                    <div className="panel-tabs">
                      <button 
                        className={expandedPlayerTab === 'kpi' ? 'active' : ''}
                        onClick={() => setExpandedPlayerTab('kpi')}
                      >
                        KPI Profile
                      </button>
                      <button 
                        className={expandedPlayerTab === 'financial' ? 'active' : ''}
                        onClick={() => setExpandedPlayerTab('financial')}
                      >
                        Financial Aid
                      </button>
                      <button 
                        className={expandedPlayerTab === 'performance' ? 'active' : ''}
                        onClick={() => setExpandedPlayerTab('performance')}
                      >
                        Performance Log
                      </button>
                      <button 
                        className={expandedPlayerTab === 'notes' ? 'active' : ''}
                        onClick={() => setExpandedPlayerTab('notes')}
                      >
                        Notes
                      </button>
                    </div>

                    {/* Panel Content - 2 Column Grid */}
                    <div className="panel-content-grid">
                      {/* Left Column - Metrics */}
                      <div className="panel-column-left">
                      {expandedPlayerTab === 'kpi' && (
                          <div className="kpi-profile-section">
                            <h4>Confidence Gate</h4>
                            <div className="metric-group">
                              <div className="metric-item">
                                <label>Confidence %</label>
                                <div className="metric-value">{selectedPlayer.confidence || 0}%</div>
                          </div>
                              <div className="metric-item">
                                <label>Data Recency</label>
                                <div className="metric-value">Current Season</div>
                          </div>
                          </div>

                            <h4>KPI Metrics</h4>
                            <div className="metric-group">
                              <div className="metric-item">
                                <label>Overall KPI</label>
                                <div className="metric-value gold">{selectedPlayer.final_kpi || selectedPlayer.kpi || 0}</div>
                          </div>
                              <div className="metric-item">
                                <label>System Fit %</label>
                                <div className="metric-value">{selectedPlayer.fit || 0}%</div>
                              </div>
                              <div className="metric-item">
                                <label>Position</label>
                                <div className="metric-value">{selectedPlayer.position}</div>
                              </div>
                              <div className="metric-item">
                                <label>Archetype</label>
                                <div className="metric-value">Offensive Threat</div>
                              </div>
                            </div>

                            <h4>Badges & Flags</h4>
                            <div className="badges-section">
                              {selectedPlayer.badges?.map((badge, i) => (
                                <span key={i} className="badge">{badge}</span>
                              ))}
                              {selectedPlayer.flags?.length > 0 && (
                                <div className="flags-section">
                                  {selectedPlayer.flags.map((flag, i) => (
                                    <span key={i} className="flag">⚠ {flag}</span>
                                  ))}
                        </div>
                      )}
                          </div>
                          </div>
                        )}

                        {expandedPlayerTab === 'performance' && (
                          <div className="performance-section">
                            <p className="empty-note">Performance log will display game-by-game or season summary when connected to KaNeXT Stats.</p>
                        </div>
                      )}
                      </div>

                      {/* Right Column - Financial & Notes */}
                      <div className="panel-column-right">
                        {expandedPlayerTab === 'financial' && (
                          <div className="financial-section">
                            <h4>Scholarship Allocation</h4>
                            <div className="form-group">
                              <label>Scholarship Slot (0.0 - 1.0)</label>
                              <input
                                type="number"
                                min="0"
                                max="1"
                                step="0.1"
                                value={selectedPlayer.scholarship_slot || (selectedPlayer.scholarship ? parseFloat(selectedPlayer.scholarship) / ((coachingBias?.scholarshipCap || 12) * 10000) : 0)}
                                onChange={(e) => {
                                  const slot = parseFloat(e.target.value) || 0;
                                  setSelectedPlayer({
                                    ...selectedPlayer,
                                    scholarship_slot: Math.min(Math.max(slot, 0), 1.0),
                                    scholarship: slot * (coachingBias?.scholarshipCap || 12) * 10000
                                  });
                                }}
                              />
                              <p className="form-note">Current: {(selectedPlayer.scholarship_slot || 0).toFixed(1)} slot</p>
                            </div>

                            <h4>NIL Value</h4>
                            <div className="form-group">
                              <label>NIL Value ($)</label>
                              <input
                                type="number"
                                min="0"
                                value={selectedPlayer.nil_value_suggestion || selectedPlayer.nil || 0}
                                onChange={(e) => {
                                  setSelectedPlayer({
                                    ...selectedPlayer,
                                    nil_value_suggestion: parseFloat(e.target.value) || 0,
                                    nil: parseFloat(e.target.value) || 0
                                  });
                                }}
                              />
                              <p className="form-note">Projected NIL valuation</p>
                            </div>

                            <h4>Funding Details</h4>
                          <div className="detail-row">
                              <span className="label">Funding Source:</span>
                              <span className="value">Scholarship + NIL</span>
                            </div>
                            <div className="detail-row">
                              <span className="label">Last Updated:</span>
                              <span className="value">{selectedPlayer.timestamp ? new Date(selectedPlayer.timestamp).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      )}

                      {expandedPlayerTab === 'notes' && (
                          <div className="notes-section">
                          <textarea 
                            className="notes-input"
                            placeholder="Add notes about this player..."
                              value={selectedPlayer.notes || ''}
                            onChange={(e) => {
                              setSelectedPlayer({ ...selectedPlayer, notes: e.target.value });
                            }}
                          />
                        </div>
                      )}
                    </div>
                    </div>

                    {/* Panel Actions */}
                    <div className="panel-actions">
                      <button className="secondary-btn" onClick={handleViewInPlayerIQ}>
                        View in Player IQ™
                      </button>
                      <button className="secondary-btn" onClick={handleSavePlayerChanges}>
                        Save Changes
                      </button>
                      <button className="danger-btn" onClick={handleRemoveToRecruiting}>
                        Remove Player
                      </button>
                    </div>
                  </div>
                )}
              </div>
          </div>
        )}

        {/* Depth Chart View */}
        {activeView === 'depth' && (
          <div className="depth-chart-view">
            {/* Action Bar - Simulation & Roster Controls */}
            <div className="depth-chart-action-bar">
              <button className="action-bar-btn" onClick={handleEvaluateTeam}>
                <span className="btn-icon">📊</span>
                <span className="btn-label">Evaluate Team</span>
              </button>
              <button className="action-bar-btn" onClick={handleRunPrediXt}>
                <span className="btn-icon">🧠</span>
                <span className="btn-label">Run PrediXt (Single Game)</span>
              </button>
              <button className="action-bar-btn" onClick={handleRunSeasonProjection}>
                <span className="btn-icon">📊</span>
                <span className="btn-label">Run Season Projection (What-If)</span>
              </button>
              <button className="action-bar-btn primary" onClick={handleApplyToRoster}>
                <span className="btn-icon">💾</span>
                <span className="btn-label">Apply to Roster</span>
              </button>
            </div>

            {/* Depth Chart Canvas */}
            <div className="depth-chart-canvas">
            <div className="depth-chart-grid">
                {['PG', 'CG', 'Wing', 'Forward', 'Big'].map(position => {
                  const primaryPlayers = getPlayersForPosition(position);
                  const benchPlayers = getBenchPlayers(position);
                  const positionWeight = calculatePositionWeight(position, depthChartState);
                  const isDragOver = dragOverPosition === position;
                  
                  return (
                <div 
                  key={position} 
                      className={`position-column ${isDragOver ? 'drag-over' : ''}`}
                      onDragOver={(e) => handleDragOver(e, position)}
                      onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, position)}
                >
                      <div className="position-header">
                        <span className="position-name">{position}</span>
                        {positionWeight > 0 && (
                          <span className="weight-indicator">{positionWeight.toFixed(0)}%</span>
                        )}
                      </div>
                      
                      {/* Primary Slots */}
                      <div className="primary-slots">
                        {primaryPlayers.length > 0 ? (
                          primaryPlayers.map((player, idx) => {
                            const scholarshipSlot = player.scholarship_slot || (player.scholarship ? parseFloat(player.scholarship) / ((coachingBias?.scholarshipCap || 12) * 10000) : 0);
                            return (
                      <div 
                        key={player.id} 
                        className="player-card"
                        draggable
                                onDragStart={(e) => handleDragStart(e, player, position)}
                      >
                        <div className="card-name">{player.name}</div>
                        <div className="card-stats">
                                  <span className="stat-item">OVR: {player.final_kpi || player.kpi || 0}</span>
                                  <span className="stat-item">FIT: {player.fit || 0}%</span>
                                  <span className="stat-item">CONF: {player.confidence || 0}%</span>
                        </div>
                                <div className="card-meta">
                                  <span className="archetype">Offensive Threat</span>
                                  <span className="scholarship-slot">Slot: {scholarshipSlot.toFixed(1)}</span>
                      </div>
                              </div>
                            );
                          })
                        ) : (
                      <div className="empty-slot">Drop players here</div>
                    )}
                  </div>

                      {/* Bench List */}
                      {benchPlayers.length > 0 && (
                        <div className="bench-section">
                          <div className="bench-header">Bench ({benchPlayers.length})</div>
                          <div className="bench-list">
                            {benchPlayers.map(player => (
                              <div 
                                key={player.id} 
                                className="bench-player"
                                draggable
                                onDragStart={(e) => handleDragStart(e, player, null)}
                              >
                                <span className="bench-name">{player.name}</span>
                                <span className="bench-fit">{player.fit || 0}%</span>
                </div>
              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Evaluation Report Side Panel */}
            {showTeamEvaluation && (
              <div className="team-evaluation-side-panel slide-in">
                <div className="evaluation-panel-header">
                  <h2>Team Evaluation Report</h2>
                  <button className="panel-close" onClick={() => setShowTeamEvaluation(false)}>×</button>
                </div>
                
                {(() => {
                  const report = generateTeamReport();
                  return (
                    <div className="evaluation-panel-content">
                      {/* Header Info */}
                      <div className="report-header-info">
                        <div className="report-field">
                          <label>Team:</label>
                          <span>{coachProfile?.team || 'Not Set'}</span>
                        </div>
                        <div className="report-field">
                          <label>Division:</label>
                          <span>{report.division}</span>
                        </div>
                        <div className="report-field">
                          <label>System:</label>
                          <span>{coachingBias?.offensiveSystem || 'Not Set'} / {coachingBias?.defensiveSystem || 'Not Set'}</span>
                        </div>
                        <div className="report-field">
                          <label>Team KPI:</label>
                          <span className="kpi-value">{report.teamKPI}</span>
                        </div>
                        <div className="report-field">
                          <label>Fit %:</label>
                          <span>{report.fitPercent}%</span>
                        </div>
                        <div className="report-field">
                          <label>Confidence Avg:</label>
                          <span>{report.confidenceAvg}%</span>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="report-section">
                        <h3>Summary</h3>
                        <p className="report-summary">{report.summary}</p>
                      </div>

                      {/* Coach K Comment */}
                      <div className="report-section coach-k-comment">
                        <h3>Coach K™ Comment</h3>
                        <p className="coach-k-text">{report.coachKComment}</p>
                      </div>

                      {/* Improvement Path */}
                      <div className="report-section">
                        <h3>Improvement Path</h3>
                        <p className="improvement-path">{report.improvementPath}</p>
                      </div>

                      {/* Resources */}
                      <div className="report-section">
                        <h3>Resources</h3>
                        <div className="resources-list">
                          <span className="resource-item">{report.resources.scholarshipSlots}</span>
                          <span className="resource-item">{report.resources.budget}</span>
                          <span className="resource-item">{report.resources.nilUnused}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Footer Actions */}
                <div className="evaluation-panel-footer">
                  <button className="secondary-btn" onClick={handleShowMatchingRecruits}>
                    Show Matching Recruits
                  </button>
                  <button className="primary-btn" onClick={handleSaveReport}>
                    Save Report
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <CoachingIQDrawer 
        isOpen={showDrawer} 
        onClose={() => setShowDrawer(false)} 
      />

      {/* Coach K™ Reaction Panel */}
      <CoachKReactionPanel
        teamMetrics={teamMetrics}
        sandboxMetrics={sandboxMetrics}
        depthChartState={depthChartState}
        coachingBias={coachingBias}
        coachProfile={coachProfile}
      />

      {/* Add from Recruiting Board Modal */}
      {showRecruitingModal && (
        <div className="recruiting-modal-overlay" onClick={() => setShowRecruitingModal(false)}>
          <div className="recruiting-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add from Recruiting Board</h2>
              <button className="modal-close" onClick={() => setShowRecruitingModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <p className="modal-note">Select evaluated recruits (Confidence ≥ 60) to add to your roster.</p>
              {/* TODO: Fetch from Recruiting IQ verified list */}
              <div className="recruits-list">
                <p className="empty-note">No qualified recruits available. Evaluate players in Recruiting IQ™ first.</p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setShowRecruitingModal(false)}>
                Cancel
              </button>
              <button className="primary-btn" disabled>
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamIQPage;

