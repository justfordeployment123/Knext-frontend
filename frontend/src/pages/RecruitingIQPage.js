import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { isAuthenticated } from '../services/authService';
import CoachingIQDrawer from '../components/CoachingIQDrawer';
import './RecruitingIQPage.css';

// Mock player database with enhanced fields
const mockPlayers = [
  { id: '1', name: 'Marcus Johnson', position: 'PG', division: 'JUCO', school: 'South Plains CC', city: 'Levelland', state: 'TX', class: 'SO', region: 'South', kpi: 78, nilReadiness: 6.5, confidence: 82, status: 'Unevaluated', archetype: 'Floor General', portalDate: null },
  { id: '2', name: 'Kevin Williams', position: 'SG', division: 'NAIA', school: 'Southwestern CC', city: 'Winfield', state: 'KS', class: 'FR', region: 'Midwest', kpi: 75, nilReadiness: 5.8, confidence: 79, status: 'Unevaluated', archetype: '3&D Wing', portalDate: null },
  { id: '3', name: 'Tyler Brown', position: 'SF', division: 'JUCO', school: 'Ranger College', city: 'Ranger', state: 'TX', class: 'SO', region: 'South', kpi: 80, nilReadiness: 7.2, confidence: 85, status: 'Evaluated', archetype: 'Versatile Wing', portalDate: null },
  { id: '4', name: 'James Davis', position: 'PF', division: 'NAIA', school: 'Bacone College', city: 'Muskogee', state: 'OK', class: 'JR', region: 'South', kpi: 76, nilReadiness: 6.0, confidence: 80, status: 'Unevaluated', archetype: 'Stretch Big', portalDate: null },
  { id: '5', name: 'Chris Miller', position: 'C', division: 'JUCO', school: 'Odessa College', city: 'Odessa', state: 'TX', class: 'FR', region: 'South', kpi: 73, nilReadiness: 5.5, confidence: 77, status: 'Unevaluated', archetype: 'Rim Protector', portalDate: null },
  { id: '6', name: 'Jordan Smith', position: 'CG', division: 'Portal', school: 'Previous: State U', city: 'Austin', state: 'TX', class: 'JR', region: 'South', kpi: 82, nilReadiness: 8.1, confidence: 88, status: 'Evaluated', archetype: 'Combo Guard', portalDate: '2024-03-15' },
  { id: '7', name: 'Alex Rodriguez', position: 'Wing', division: 'NCAA D2', school: 'Metro State', city: 'Denver', state: 'CO', class: 'SO', region: 'West', kpi: 79, nilReadiness: 6.8, confidence: 83, status: 'Unevaluated', archetype: '3&D Wing', portalDate: null },
];

const RecruitingIQPage = () => {
  const navigate = useNavigate();
  const { coachProfile, recruitingState, setRecruitingState, teamState, setTeamState, coachingBias } = useApp();
  
  const [filters, setFilters] = useState({
    search: '',
    division: ['JUCO', 'NAIA', 'Portal'], // Default to JUCO + NAIA + Portal
    position: '',
    class: '',
    region: '',
    state: '',
    archetype: ''
  });

  const [sortBy, setSortBy] = useState('kpi'); // kpi, confidence, nilReadiness, fit, portalDate
  const [sortDirection, setSortDirection] = useState('desc'); // asc, desc
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [detailTab, setDetailTab] = useState('profile'); // profile, evaluation, market, notes
  const [viewMode, setViewMode] = useState('list'); // list or board
  const [mainView, setMainView] = useState('database'); // database or recruiting-board
  const [boardViewMode, setBoardViewMode] = useState('all'); // all, priority, class
  const [expandedRecruit, setExpandedRecruit] = useState(null);
  const [editingRecruit, setEditingRecruit] = useState(null);
  const [showAddProspectModal, setShowAddProspectModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [coachKInsights, setCoachKInsights] = useState([]);
  const [isCoachKCollapsed, setIsCoachKCollapsed] = useState(false);
  const [isCoachKPinned, setIsCoachKPinned] = useState(true);
  const [newProspect, setNewProspect] = useState({
    name: '',
    position: '',
    division: '',
    school: '',
    city: '',
    state: '',
    class: ''
  });

  // Calculate roster composition by position
  const rosterComposition = useMemo(() => {
    if (!teamState?.roster || teamState.roster.length === 0) {
      return { PG: 0, CG: 0, Wing: 0, F: 0, Big: 0 };
    }
    
    const comp = { PG: 0, CG: 0, Wing: 0, F: 0, Big: 0 };
    teamState.roster.forEach(player => {
      const pos = player.position || '';
      if (pos === 'PG') comp.PG++;
      else if (pos === 'CG' || pos === 'SG') comp.CG++;
      else if (pos === 'Wing' || pos === 'SF') comp.Wing++;
      else if (pos === 'PF' || pos === 'F') comp.F++;
      else if (pos === 'C' || pos === 'Big') comp.Big++;
    });
    return comp;
  }, [teamState?.roster]);

  // Calculate recruiting metrics
  const recruitingMetrics = useMemo(() => {
    const activeRecruits = recruitingState.activeRecruits || [];
    const priorityRecruits = activeRecruits.filter(r => r.isPriority === true);
    const committedRecruits = activeRecruits.filter(r => r.status === 'Committed');
    const committedPercent = activeRecruits.length > 0 
      ? Math.round((committedRecruits.length / activeRecruits.length) * 100) 
      : 0;

    // Calculate budget used
    const scholarshipCap = coachingBias?.scholarshipCap || 12;
    const nilPool = coachingBias?.nilPool || 50000;
    
    const totalScholarshipOffers = activeRecruits.reduce((sum, r) => 
      sum + parseFloat(r.scholarshipOffer || 0), 0);
    const totalNILOffers = activeRecruits.reduce((sum, r) => 
      sum + parseFloat(r.nilOffer || 0), 0);
    
    const scholarshipUsed = scholarshipCap > 0 
      ? Math.round((totalScholarshipOffers / scholarshipCap) * 100) 
      : 0;
    const nilUsed = nilPool > 0 
      ? Math.round((totalNILOffers / nilPool) * 100) 
      : 0;
    
    const budgetUsed = Math.max(scholarshipUsed, nilUsed);

    return {
      activeRecruits: activeRecruits.length,
      priorityRecruits: priorityRecruits.length,
      committedPercent,
      budgetUsed
    };
  }, [recruitingState, coachingBias]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let filtered = mockPlayers.filter(player => {
      // Search filter (name, school, city, state)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          player.name.toLowerCase().includes(searchLower) ||
          player.school.toLowerCase().includes(searchLower) ||
          (player.city && player.city.toLowerCase().includes(searchLower)) ||
          (player.state && player.state.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Division filter (can be multiple)
      if (filters.division.length > 0 && !filters.division.includes(player.division)) {
        return false;
      }

      // Position filter
    if (filters.position && player.position !== filters.position) return false;

      // Class filter
    if (filters.class && player.class !== filters.class) return false;

      // Region filter
      if (filters.region && player.region !== filters.region) return false;

      // State filter
      if (filters.state && player.state !== filters.state) return false;

      // Archetype filter
      if (filters.archetype && player.archetype !== filters.archetype) return false;

    return true;
  });

    // Sort players
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'kpi':
          aVal = a.kpi || 0;
          bVal = b.kpi || 0;
          break;
        case 'confidence':
          aVal = a.confidence || 0;
          bVal = b.confidence || 0;
          break;
        case 'nilReadiness':
          aVal = a.nilReadiness || 0;
          bVal = b.nilReadiness || 0;
          break;
        case 'fit':
          aVal = a.fit || 0;
          bVal = b.fit || 0;
          break;
        case 'portalDate':
          aVal = a.portalDate ? new Date(a.portalDate).getTime() : 0;
          bVal = b.portalDate ? new Date(b.portalDate).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aVal - bVal;
      } else {
        return bVal - aVal;
      }
    });

    return filtered;
  }, [filters, sortBy, sortDirection]);

  const addCoachKInsight = (message, type = 'info', icon = '🧠') => {
    const insight = {
      id: Date.now(),
      message,
      type,
      icon,
      timestamp: Date.now()
    };
    setCoachKInsights(prev => [insight, ...prev].slice(0, 3)); // Keep only latest 3
    
    // Auto-fade after 30 seconds
    setTimeout(() => {
      setCoachKInsights(prev => prev.filter(i => i.id !== insight.id));
    }, 30000);
  };

  const handleAddToBoard = (player) => {
    console.log('[LOGIC HOOK: handleAddToBoard] Adding player to recruiting board:', player.id);
    const newRecruit = {
      ...player,
      recruitingStatus: 'Lead',
      isPriority: false,
      scholarshipOffer: 0,
      nilOffer: 0,
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      notes: '',
      source: 'Manual',
      age: player.age || 20
    };

    setRecruitingState(prev => ({
      ...prev,
      activeRecruits: [...(prev.activeRecruits || []), newRecruit]
    }));

    // Coach K insight
    if (player.status === 'Evaluated') {
      addCoachKInsight(`New recruit added — run Player IQ™ to unlock verified KPI.`, 'info', '🧠');
    } else {
      addCoachKInsight(`New recruit added — run Player IQ™ to unlock verified KPI.`, 'info', '🧠');
    }

    alert(`✅ ${player.name} added to Recruiting Board`);
  };

  const handleTogglePriority = (recruitId) => {
    const recruit = (recruitingState.activeRecruits || []).find(r => r.id === recruitId);
    const newPriority = !recruit?.isPriority;
    
    setRecruitingState(prev => ({
      ...prev,
      activeRecruits: (prev.activeRecruits || []).map(r => 
        r.id === recruitId ? { ...r, isPriority: newPriority } : r
      )
    }));

    // Coach K insight
    if (newPriority) {
      addCoachKInsight(`⭐ Recruit flagged priority — next follow-up due in 5 days.`, 'priority', '⭐');
    }
  };

  const handleUpdateRecruit = (recruitId, updates) => {
    const recruit = (recruitingState.activeRecruits || []).find(r => r.id === recruitId);
    const prevStatus = recruit?.recruitingStatus;
    const prevScholarship = recruit?.scholarshipOffer || 0;
    const prevNIL = recruit?.nilOffer || 0;
    
    setRecruitingState(prev => ({
      ...prev,
      activeRecruits: (prev.activeRecruits || []).map(r => 
        r.id === recruitId ? { ...r, ...updates, lastUpdated: new Date().toISOString() } : r
      )
    }));
    setEditingRecruit(null);

    // Coach K insights based on updates
    if (updates.recruitingStatus && updates.recruitingStatus !== prevStatus) {
      const statusMessages = {
        'Active': 'Contact made — monitor academic clearance.',
        'Offered': 'Budget impact +5%.',
        'Committed': 'Commit secured · Class KPI +1.6 · Add Big to balance frontcourt.',
        'Rejected': 'Offer withdrawn.'
      };
      if (statusMessages[updates.recruitingStatus]) {
        addCoachKInsight(`${prevStatus} → ${updates.recruitingStatus} · ${statusMessages[updates.recruitingStatus]}`, 
          updates.recruitingStatus === 'Committed' ? 'success' : 'info', '💰');
      }
    }

    if (updates.scholarshipOffer !== undefined) {
      const delta = updates.scholarshipOffer - prevScholarship;
      const scholarshipCap = coachingBias?.scholarshipCap || 12;
      const totalUsed = (recruitingState.activeRecruits || []).reduce((sum, r) => 
        sum + (r.id === recruitId ? updates.scholarshipOffer : (r.scholarshipOffer || 0)), 0);
      const slotsUsed = Math.round(totalUsed / 30000 * 10) / 10;
      
      if (delta !== 0) {
        const sign = delta > 0 ? '+' : '';
        addCoachKInsight(
          `Offer ${sign}$${Math.abs(delta).toLocaleString()} · Scholarship budget now ${slotsUsed} / ${scholarshipCap} slots.`,
          delta > 0 ? 'warning' : 'info',
          '💰'
        );
      }
    }

    if (updates.nilOffer !== undefined) {
      const delta = updates.nilOffer - prevNIL;
      const nilPool = coachingBias?.nilPool || 50000;
      const totalUsed = (recruitingState.activeRecruits || []).reduce((sum, r) => 
        sum + (r.id === recruitId ? updates.nilOffer : (r.nilOffer || 0)), 0);
      const percentUsed = Math.round((totalUsed / nilPool) * 100);
      
      if (delta !== 0) {
        const sign = delta > 0 ? '+' : '';
        addCoachKInsight(
          `Increased NIL offer ${sign}$${Math.abs(delta).toLocaleString()} — NIL pool now ${percentUsed}% used.`,
          'info',
          '💰'
        );
      }
    }
  };

  const handleMoveToTeamIQ = (recruit) => {
    if (recruit.confidence >= 60 && recruit.recruitingStatus === 'Committed') {
      const teamPlayer = {
        ...recruit,
        scholarship: recruit.scholarshipOffer || 0,
        nil: recruit.nilOffer || 0
      };
      setTeamState(prev => ({
        ...prev,
        roster: [...(prev.roster || []), teamPlayer]
      }));
      
      // Coach K insight
      const avgKPI = teamState.roster?.length > 0 
        ? teamState.roster.reduce((sum, p) => sum + (p.final_kpi || p.kpi || 0), 0) / teamState.roster.length 
        : 0;
      const newAvgKPI = [...(teamState.roster || []), teamPlayer].reduce((sum, p) => sum + (p.final_kpi || p.kpi || 0), 0) / (teamState.roster?.length || 0 + 1);
      const deltaKPI = (newAvgKPI - avgKPI).toFixed(1);
      
      addCoachKInsight(`Commit secured · Class KPI +${deltaKPI} · Add Big to balance frontcourt.`, 'success', '🏀');
      alert(`✅ ${recruit.name} added to Team IQ™`);
    } else {
      alert('Player must be Committed with Confidence ≥ 60% to add to Team IQ™');
    }
  };

  const handleRemoveRecruit = (recruitId) => {
    const recruit = (recruitingState.activeRecruits || []).find(r => r.id === recruitId);
    
    if (window.confirm('Remove this recruit from board?')) {
      setRecruitingState(prev => ({
        ...prev,
        activeRecruits: (prev.activeRecruits || []).filter(r => r.id !== recruitId)
      }));
      setExpandedRecruit(null);
      
      // Coach K insight
      if (recruit) {
        const scholarshipSlot = recruit.scholarshipOffer > 0 ? 'Scholarship slot opened (+1) · ' : '';
        addCoachKInsight(`Recruit removed · ${scholarshipSlot}NIL pool reset 4%`, 'info', '⚠');
      }
    }
  };

  // Get filtered recruits for board view
  const boardRecruits = useMemo(() => {
    let recruits = recruitingState.activeRecruits || [];
    
    if (boardViewMode === 'priority') {
      recruits = recruits.filter(r => r.isPriority === true);
    }
    
    return recruits;
  }, [recruitingState.activeRecruits, boardViewMode]);

  // Calculate class composition for Coach K
  const classComposition = useMemo(() => {
    const recruits = recruitingState.activeRecruits || [];
    const guards = recruits.filter(r => ['PG', 'CG', 'SG'].includes(r.position)).length;
    const forwards = recruits.filter(r => ['SF', 'PF', 'F', 'Wing'].includes(r.position)).length;
    const bigs = recruits.filter(r => ['C', 'Big'].includes(r.position)).length;
    
    return { guards, forwards, bigs, total: recruits.length };
  }, [recruitingState.activeRecruits]);

  // Check for priority recruit inactivity
  const priorityInactivityCheck = useMemo(() => {
    const priorityRecruits = (recruitingState.activeRecruits || []).filter(r => r.isPriority);
    const now = Date.now();
    
    return priorityRecruits.map(recruit => {
      const lastContact = recruit.lastUpdated ? new Date(recruit.lastUpdated).getTime() : 
                         recruit.dateAdded ? new Date(recruit.dateAdded).getTime() : now;
      const daysSince = Math.floor((now - lastContact) / (1000 * 60 * 60 * 24));
      return { recruit, daysSince };
    }).filter(item => item.daysSince >= 5)
      .sort((a, b) => b.daysSince - a.daysSince)[0]; // Most inactive
  }, [recruitingState.activeRecruits]);

  // Generate strategic insights
  useEffect(() => {
    if (priorityInactivityCheck && priorityInactivityCheck.daysSince >= 9) {
      const message = `⭐ Priority recruit uncontacted ${priorityInactivityCheck.daysSince} days — follow-up to sustain interest.`;
      const insight = {
        id: Date.now(),
        message,
        type: 'warning',
        icon: '⭐',
        timestamp: Date.now()
      };
      setCoachKInsights(prev => [insight, ...prev].slice(0, 3));
      setTimeout(() => {
        setCoachKInsights(prev => prev.filter(i => i.id !== insight.id));
      }, 30000);
    }
  }, [priorityInactivityCheck]);

  // Calculate budget summary
  const budgetSummary = useMemo(() => {
    const recruits = recruitingState.activeRecruits || [];
    const scholarshipCap = coachingBias?.scholarshipCap || 12;
    const nilPool = coachingBias?.nilPool || 50000;
    
    const totalScholarship = recruits.reduce((sum, r) => sum + (r.scholarshipOffer || 0), 0);
    const totalNIL = recruits.reduce((sum, r) => sum + (r.nilOffer || 0), 0);
    const scholarshipSlots = Math.round((totalScholarship / 30000) * 10) / 10;
    const scholarshipPercent = Math.round((scholarshipSlots / scholarshipCap) * 100);
    const nilPercent = Math.round((totalNIL / nilPool) * 100);
    
    const committed = recruits.filter(r => r.recruitingStatus === 'Committed').length;
    const avgKPI = recruits.length > 0 
      ? recruits.reduce((sum, r) => sum + (r.final_kpi || r.kpi || 0), 0) / recruits.length 
      : 0;
    const avgFit = recruits.length > 0
      ? recruits.reduce((sum, r) => sum + (r.fit || 0), 0) / recruits.length
      : 0;
    
    return {
      scholarshipSlots,
      scholarshipPercent,
      nilPercent,
      committed,
      avgKPI: avgKPI.toFixed(1),
      avgFit: Math.round(avgFit)
    };
  }, [recruitingState.activeRecruits, coachingBias]);

  const handleEvaluate = (player) => {
    console.log('[LOGIC HOOK: handleEvaluate] Evaluating player:', player.id);
    navigate('/player-iq', { state: { playerData: player } });
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    console.log('[LOGIC HOOK: handleFilterChange] Filter updated:', { [key]: value });
  };

  const handleDivisionToggle = (division) => {
    setFilters(prev => {
      const divisions = prev.division || [];
      if (divisions.includes(division)) {
        return { ...prev, division: divisions.filter(d => d !== division) };
      } else {
        return { ...prev, division: [...divisions, division] };
      }
    });
  };

  // Get scholarship and NIL info for tooltip
  const getFinancialInfo = () => {
    const scholarshipCap = coachingBias?.scholarshipCap || 12;
    const nilPool = coachingBias?.nilPool || 50000;
    const usedScholarships = teamState?.roster?.filter(p => parseFloat(p.scholarship_suggestion || p.scholarship || 0) > 0).length || 0;
    const usedNIL = teamState?.roster?.reduce((sum, p) => sum + parseFloat(p.nil_value_suggestion || p.nil || 0), 0) || 0;
    
    const remainingScholarships = scholarshipCap - usedScholarships;
    const remainingNIL = nilPool - usedNIL;
    
    return {
      remainingScholarships: remainingScholarships.toFixed(1),
      remainingNIL: remainingNIL.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    };
  };

  const handleAddProspect = () => {
    console.log('[LOGIC HOOK: handleAddProspect] Adding new prospect:', newProspect);
    const prospect = {
      id: Date.now().toString(),
      ...newProspect,
      division: newProspect.division || 'Manual',
      region: newProspect.region || 'N/A',
      kpi: Math.floor(Math.random() * 20) + 70,
      nilReadiness: Math.floor(Math.random() * 4) + 6,
      confidence: null,
      status: 'Unevaluated',
      portalDate: null
    };
    // Add to mock players (in real app, this would go to backend)
    mockPlayers.push(prospect);
    handleAddToBoard(prospect);
    setShowAddProspectModal(false);
    setNewProspect({ name: '', position: '', division: '', school: '', city: '', state: '', class: '' });
    // Prompt for evaluation
    if (window.confirm('New record added — evaluate in Player IQ™ now?')) {
      handleEvaluate(prospect);
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

  if (!isAuthenticated() || !coachProfile) {
    return null;
  }

  const financialInfo = getFinancialInfo();
  const scholarshipCap = coachingBias?.scholarshipCap || 12;
  const nilPool = coachingBias?.nilPool || 50000;
  const usedScholarships = teamState?.roster?.filter(p => parseFloat(p.scholarship_suggestion || p.scholarship || 0) > 0).length || 0;
  const usedNIL = teamState?.roster?.reduce((sum, p) => sum + parseFloat(p.nil_value_suggestion || p.nil || 0), 0) || 0;
  const scholarshipPercent = scholarshipCap > 0 ? Math.round((usedScholarships / scholarshipCap) * 100) : 0;
  const nilPercent = nilPool > 0 ? Math.round((usedNIL / nilPool) * 100) : 0;

  return (
    <div className="recruiting-iq-page">
      {/* Section 1 - Header / Filter Bar */}
      <header className="recruiting-iq-header">
        {/* Main Bar - 80px */}
        <div className="header-main-bar">
          {/* Left Zone - Program Context + Roster Summary */}
          <div className="header-left-zone">
            <h1>RECRUITING IQ™ DATABASE</h1>
            <p className="subtitle">National prospect feed · dynamic by level and region.</p>
            <div className="context-line">
              <span 
                className="context-link" 
                onClick={() => navigate('/team-iq')}
                title="View Team IQ™ Roster"
              >
                Team: {coachProfile.team}
              </span>
              {' · '}
              <span 
                className="context-link" 
                onClick={() => {
                  const event = new CustomEvent('openCoachingIQDrawer');
                  window.dispatchEvent(event);
                }}
                title="Open Coaching IQ™ Drawer"
              >
                System: {coachProfile.offense} / {coachProfile.defense}
              </span>
              {' · '}
              <span 
                className="context-link"
                title={`Remaining slots ${financialInfo.remainingScholarships} · Remaining NIL ${financialInfo.remainingNIL}`}
              >
                Scholarships: {usedScholarships} / {scholarshipCap}
              </span>
              {' · '}
              <span 
                className="context-link"
                title={`Remaining slots ${financialInfo.remainingScholarships} · Remaining NIL ${financialInfo.remainingNIL}`}
              >
                NIL Used: {nilPercent}%
              </span>
            </div>
            <div className="roster-composition">
              <span>PG {rosterComposition.PG}</span>
              <span>·</span>
              <span>CG {rosterComposition.CG}</span>
              <span>·</span>
              <span>Wing {rosterComposition.Wing}</span>
              <span>·</span>
              <span>F {rosterComposition.F}</span>
              <span>·</span>
              <span>Big {rosterComposition.Big}</span>
          </div>
          </div>

          {/* Center Zone - Search / Filter Controls */}
          <div className="header-center-zone">
            <input
              type="text"
              placeholder="Search by name, school, city, state..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>

          {/* Right Zone - Global Actions & Navigation */}
          <div className="header-right-zone">
            <button 
              className="nav-btn" 
              onClick={() => {
                console.log('[LOGIC HOOK] Opening Coaching IQ Drawer from Recruiting IQ header');
                const event = new CustomEvent('openCoachingIQDrawer');
                window.dispatchEvent(event);
              }}
              title="Coaching IQ™"
            >
              🧠
            </button>
            <button 
              className={`nav-btn ${mainView === 'recruiting-board' ? 'active' : ''}`}
              onClick={() => setMainView(mainView === 'database' ? 'recruiting-board' : 'database')}
              title="My Recruiting Board"
            >
              📋
            </button>
            <button 
              className="nav-btn" 
              onClick={() => navigate('/team-iq')}
              title="Team IQ™"
            >
              🏀
            </button>
            <button 
              className="nav-btn" 
              onClick={() => setShowAddProspectModal(true)}
              title="Add Prospect"
            >
              ➕
            </button>
            <button 
              className="nav-btn" 
              onClick={() => navigate('/office')}
              title="Return to Office"
            >
              🏠
            </button>
          </div>
        </div>

        {/* Summary Line - 40px */}
        <div className="summary-line">
          <div className="summary-item">
            <span className="label">Active Recruits:</span>
            <span className="value">{recruitingMetrics.activeRecruits}</span>
          </div>
          <div className="summary-item">
            <span className="label">Priority Recruits:</span>
            <span className="value" title="⭐ View Priority Board">
              ⭐ {recruitingMetrics.priorityRecruits}
            </span>
          </div>
          <div className="summary-item">
            <span className="label">Committed %:</span>
            <span className="value">{recruitingMetrics.committedPercent}%</span>
          </div>
          <div className="summary-item">
            <span className="label">Budget Used %:</span>
            <span className="value">{recruitingMetrics.budgetUsed}%</span>
          </div>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Level / Division:</label>
          <div className="division-toggles">
            {['JUCO', 'NAIA', 'Portal', 'NCAA D1', 'NCAA D2', 'NCAA D3', 'Manual'].map(div => (
              <button
                key={div}
                className={`division-toggle ${(filters.division || []).includes(div) ? 'active' : ''}`}
                onClick={() => handleDivisionToggle(div)}
              >
                {div}
              </button>
            ))}
          </div>
        </div>
        
        <select value={filters.position} onChange={(e) => handleFilterChange('position', e.target.value)}>
          <option value="">All Positions</option>
          <option value="PG">PG</option>
          <option value="CG">CG</option>
          <option value="SG">SG</option>
          <option value="Wing">Wing</option>
          <option value="SF">SF</option>
          <option value="PF">PF</option>
          <option value="F">F</option>
          <option value="C">C</option>
          <option value="Big">Big</option>
        </select>
        
        <select value={filters.class} onChange={(e) => handleFilterChange('class', e.target.value)}>
          <option value="">All Classes</option>
          <option value="FR">HS FR / College FR</option>
          <option value="SO">HS SO / College SO</option>
          <option value="JR">HS JR / College JR</option>
          <option value="SR">HS SR / College SR</option>
        </select>
        
        <select value={filters.region} onChange={(e) => handleFilterChange('region', e.target.value)}>
          <option value="">All Regions</option>
          <option value="West">West</option>
          <option value="Midwest">Midwest</option>
          <option value="South">South</option>
          <option value="East">East</option>
        </select>
        
        <select value={filters.state} onChange={(e) => handleFilterChange('state', e.target.value)}>
          <option value="">All States</option>
          <option value="TX">Texas</option>
          <option value="CA">California</option>
          <option value="FL">Florida</option>
          <option value="NY">New York</option>
          <option value="IL">Illinois</option>
          <option value="PA">Pennsylvania</option>
          <option value="OH">Ohio</option>
          <option value="GA">Georgia</option>
          <option value="NC">North Carolina</option>
          <option value="MI">Michigan</option>
        </select>
        
        <select value={filters.archetype} onChange={(e) => handleFilterChange('archetype', e.target.value)}>
          <option value="">All Archetypes</option>
          <option value="Floor General">Floor General</option>
          <option value="3&D Wing">3&D Wing</option>
          <option value="Versatile Wing">Versatile Wing</option>
          <option value="Stretch Big">Stretch Big</option>
          <option value="Rim Protector">Rim Protector</option>
          <option value="Combo Guard">Combo Guard</option>
        </select>
        
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="kpi">Neutral KPI (desc)</option>
          <option value="confidence">Confidence %</option>
          <option value="nilReadiness">NIL Readiness</option>
          <option value="fit">Fit %</option>
          <option value="portalDate">Portal Date</option>
        </select>
        
        <div className="view-toggle">
          <button 
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
          <button 
            className={viewMode === 'board' ? 'active' : ''}
            onClick={() => setViewMode('board')}
          >
            Board
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`recruiting-content ${isCoachKPinned ? (isCoachKCollapsed ? 'with-coach-k-collapsed' : '') : 'without-coach-k'}`}>
        {mainView === 'recruiting-board' ? (
          <div className="recruiting-board-view">
            <div className="board-header">
              <h2>My Recruiting Board</h2>
              <div className="board-view-switcher">
                <button 
                  className={boardViewMode === 'all' ? 'active' : ''}
                  onClick={() => setBoardViewMode('all')}
                >
                  All Recruits
                </button>
                <button 
                  className={boardViewMode === 'priority' ? 'active' : ''}
                  onClick={() => setBoardViewMode('priority')}
                >
                  ⭐ Priority View
                </button>
                <button 
                  className={boardViewMode === 'class' ? 'active' : ''}
                  onClick={() => setBoardViewMode('class')}
                >
                  Class View
                </button>
              </div>
            </div>

            {boardViewMode === 'priority' && (
              <div className="priority-banner">
                ⭐ Priority View Active — Top Targets
              </div>
            )}

            {/* Main Recruiting Table */}
            <div className="recruiting-table-container">
              <table className="recruiting-table">
                <thead>
                  <tr>
                    <th>⭐</th>
                    <th>Name</th>
                    <th>POS</th>
                    <th>AGE</th>
                    <th>OVR (KPI)</th>
                    <th>FIT %</th>
                    <th>CONF %</th>
                    <th>STATUS</th>
                    <th>SCH ($)</th>
                    <th>NIL ($)</th>
                    <th>NOTES</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {boardRecruits.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="empty-state">
                        No recruits on board yet. Add players from the database view.
                      </td>
                    </tr>
                  ) : (
                    boardRecruits.map(recruit => (
                      <React.Fragment key={recruit.id}>
                        <tr 
                          className={expandedRecruit?.id === recruit.id ? 'expanded' : ''}
                          onClick={() => setExpandedRecruit(expandedRecruit?.id === recruit.id ? null : recruit)}
                        >
                          <td>
                            <button
                              className={`priority-toggle ${recruit.isPriority ? 'active' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePriority(recruit.id);
                              }}
                            >
                              {recruit.isPriority ? '⭐' : '☆'}
                            </button>
                          </td>
                          <td className="player-name-cell">{recruit.name}</td>
                          <td>{recruit.position}</td>
                          <td>{recruit.age || 'N/A'} / {recruit.class}</td>
                          <td className="kpi-cell">{recruit.final_kpi || recruit.kpi || 'N/A'}</td>
                          <td>{recruit.fit || 'N/A'}%</td>
                          <td>{recruit.confidence || 'N/A'}%</td>
                          <td>
                            <span className={`status-badge status-${(recruit.recruitingStatus || 'Lead').toLowerCase()}`}>
                              {recruit.recruitingStatus || 'Lead'}
                            </span>
                          </td>
                          <td>
                            {editingRecruit?.id === recruit.id && editingRecruit?.field === 'scholarship' ? (
                              <input
                                type="number"
                                value={editingRecruit.value}
                                onChange={(e) => setEditingRecruit({...editingRecruit, value: e.target.value})}
                                onBlur={() => handleUpdateRecruit(recruit.id, { scholarshipOffer: parseFloat(editingRecruit.value) || 0 })}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateRecruit(recruit.id, { scholarshipOffer: parseFloat(editingRecruit.value) || 0 });
                                  }
                                }}
                                autoFocus
                                className="inline-edit"
                              />
                            ) : (
                              <span 
                                className="editable-value"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRecruit({ id: recruit.id, field: 'scholarship', value: recruit.scholarshipOffer || 0 });
                                }}
                              >
                                ${(recruit.scholarshipOffer || 0).toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td>
                            {editingRecruit?.id === recruit.id && editingRecruit?.field === 'nil' ? (
                              <input
                                type="number"
                                value={editingRecruit.value}
                                onChange={(e) => setEditingRecruit({...editingRecruit, value: e.target.value})}
                                onBlur={() => handleUpdateRecruit(recruit.id, { nilOffer: parseFloat(editingRecruit.value) || 0 })}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateRecruit(recruit.id, { nilOffer: parseFloat(editingRecruit.value) || 0 });
                                  }
                                }}
                                autoFocus
                                className="inline-edit"
                              />
                            ) : (
                              <span 
                                className="editable-value"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingRecruit({ id: recruit.id, field: 'nil', value: recruit.nilOffer || 0 });
                                }}
                              >
                                ${(recruit.nilOffer || 0).toLocaleString()}
                              </span>
                            )}
                          </td>
                          <td className="notes-cell">{recruit.notes || '—'}</td>
                          <td>
                            <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                              <button className="action-btn-icon" onClick={() => setSelectedPlayer(recruit)} title="View">
                                👁
                              </button>
                              <button className="action-btn-icon" onClick={() => setEditingRecruit({ id: recruit.id, field: 'edit', value: recruit })} title="Edit">
                                ⚙️
                              </button>
                              {recruit.confidence >= 60 && recruit.recruitingStatus === 'Committed' && (
                                <button className="action-btn-icon" onClick={() => handleMoveToTeamIQ(recruit)} title="Move to Team IQ">
                                  🏀
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Expanded Recruit View */}
                        {expandedRecruit?.id === recruit.id && (
                          <tr className="expanded-row">
                            <td colSpan="12">
                              <div className="expanded-recruit-panel">
                                <div className="expanded-left">
                                  <h3>Evaluation Summary</h3>
                                  <div className="recruit-summary">
                                    <div className="recruit-avatar">{recruit.name.charAt(0)}</div>
                                    <div className="recruit-info">
                                      <h4>{recruit.name}</h4>
                                      <p>{recruit.position} · OVR {recruit.final_kpi || recruit.kpi || 'N/A'} · Fit {recruit.fit || 'N/A'}%</p>
                                      <p>Archetype: {recruit.archetype || 'N/A'}</p>
                                      <p>Role: {recruit.roleProjection || 'N/A'}</p>
                                    </div>
                                  </div>
                                  <div className="recruit-metrics">
                                    <div className="metric-item">
                                      <label>KPI</label>
                                      <span>{recruit.final_kpi || recruit.kpi || 'N/A'}</span>
                                    </div>
                                    <div className="metric-item">
                                      <label>Fit %</label>
                                      <span>{recruit.fit || 'N/A'}%</span>
                                    </div>
                                    <div className="metric-item">
                                      <label>Confidence %</label>
                                      <span>{recruit.confidence || 'N/A'}%</span>
                                    </div>
                                    {(recruit.badges || recruit.flags) && (
                                      <div className="metric-item full-width">
                                        <label>Badges / Flags</label>
                                        <div className="badges-flags-list">
                                          {recruit.badges?.map((badge, idx) => (
                                            <span key={idx} className="badge">🏅 {badge}</span>
                                          ))}
                                          {recruit.flags?.map((flag, idx) => (
                                            <span key={idx} className="flag">⚠ {flag}</span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <button className="view-full-btn" onClick={() => {
                                    setSelectedPlayer(recruit);
                                    setExpandedRecruit(null);
                                  }}>
                                    View Full Evaluation →
                                  </button>
                                </div>
                                <div className="expanded-right">
                                  <h3>Recruiting Details</h3>
                                  <div className="recruiting-details-form">
                                    <div className="form-field">
                                      <label>Status</label>
                                      <select
                                        value={recruit.recruitingStatus || 'Lead'}
                                        onChange={(e) => handleUpdateRecruit(recruit.id, { recruitingStatus: e.target.value })}
                                      >
                                        <option value="Lead">Lead</option>
                                        <option value="Active">Active</option>
                                        <option value="Offered">Offered</option>
                                        <option value="Committed">Committed</option>
                                        <option value="Rejected">Rejected</option>
                                      </select>
                                    </div>
                                    <div className="form-field">
                                      <label>Scholarship ($)</label>
                                      <input
                                        type="number"
                                        value={recruit.scholarshipOffer || 0}
                                        onChange={(e) => handleUpdateRecruit(recruit.id, { scholarshipOffer: parseFloat(e.target.value) || 0 })}
                                      />
                                    </div>
                                    <div className="form-field">
                                      <label>NIL Value ($)</label>
                                      <input
                                        type="number"
                                        value={recruit.nilOffer || 0}
                                        onChange={(e) => handleUpdateRecruit(recruit.id, { nilOffer: parseFloat(e.target.value) || 0 })}
                                      />
                                    </div>
                                    <div className="form-field">
                                      <label>Timeline</label>
                                      <div className="timeline-info">
                                        <span>First Contact: {recruit.dateAdded ? new Date(recruit.dateAdded).toLocaleDateString() : 'N/A'}</span>
                                        <span>Last Update: {recruit.lastUpdated ? new Date(recruit.lastUpdated).toLocaleDateString() : 'N/A'}</span>
                                      </div>
                                    </div>
                                    <div className="form-field">
                                      <label>Source</label>
                                      <span>{recruit.source || 'N/A'}</span>
                                    </div>
                                    <div className="form-field">
                                      <label>Coach Notes</label>
                                      <textarea
                                        value={recruit.notes || ''}
                                        onChange={(e) => handleUpdateRecruit(recruit.id, { notes: e.target.value })}
                                        placeholder="Add notes about this recruit..."
                                        rows="4"
                                      />
                                    </div>
                                    <div className="expanded-actions">
                                      <button className="primary-btn" onClick={() => {
                                        handleUpdateRecruit(recruit.id, {});
                                      }}>
                                        Save Changes
                                      </button>
                                      {recruit.confidence >= 60 && recruit.recruitingStatus === 'Committed' && (
                                        <button className="secondary-btn" onClick={() => handleMoveToTeamIQ(recruit)}>
                                          🏀 Move to Team IQ™
                                        </button>
                                      )}
                                      <button className="danger-btn" onClick={() => handleRemoveRecruit(recruit.id)}>
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          viewMode === 'list' ? (
          <div className="list-view">
            <table className="player-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>POS</th>
                  <th>DIVISION</th>
                  <th>SCHOOL</th>
                  <th>CLASS</th>
                  <th>REGION</th>
                  <th>KPI (raw)</th>
                  <th>NIL READINESS</th>
                  <th>CONF %</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map(player => (
                  <tr 
                    key={player.id} 
                    onClick={() => setSelectedPlayer(player)}
                    className={selectedPlayer?.id === player.id ? 'active-row' : ''}
                  >
                    <td className="player-name">{player.name}</td>
                    <td>{player.position}</td>
                    <td><span className={`division-badge division-${player.division.toLowerCase().replace(/\s+/g, '-')}`}>{player.division}</span></td>
                    <td>{player.school}</td>
                    <td>{player.class}</td>
                    <td>{player.region || '-'}</td>
                    <td className="kpi-value">{player.kpi}</td>
                    <td>{player.nilReadiness}/10</td>
                    <td>{player.confidence ? `${player.confidence}%` : '-'}</td>
                    <td>
                      <span className={`status-badge status-${player.status.toLowerCase()}`}>
                        {player.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlayer(player);
                          }}
                          title="View Details"
                        >
                          👁
                        </button>
                        <button 
                          className="action-btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEvaluate(player);
                          }}
                          title="Evaluate"
                        >
                          🧠
                        </button>
                        <button 
                          className="action-btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToBoard(player);
                          }}
                          title="Add to Board"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="board-view">
            {filteredPlayers.map(player => (
              <div 
                key={player.id} 
                className={`player-card division-${player.division.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setSelectedPlayer(player)}
              >
                <div className="card-avatar">{player.name.charAt(0)}</div>
                <h3>{player.name}</h3>
                <p className="card-position">{player.position} · {player.division}</p>
                <p className="card-school">{player.school} / {player.region || 'N/A'}</p>
                <div className="card-stats">
                  <div className="stat">
                    <span className="label">KPI:</span>
                    <span className="value">{player.kpi}</span>
                  </div>
                  <div className="stat">
                    <span className="label">NIL:</span>
                    <span className="value">{player.nilReadiness}</span>
                  </div>
                </div>
                {player.confidence && (
                  <div className="card-confidence">
                    Confidence: {player.confidence}%
                  </div>
                )}
                {player.fit && (
                  <div className="card-fit">
                    Fit: {player.fit}%
                  </div>
                )}
                <div className={`card-status-badge status-${player.status.toLowerCase()}`}>
                  {player.status}
                </div>
                <div className="card-actions">
                  <button 
                    className="card-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEvaluate(player);
                    }}
                  >
                    🧠 Evaluate
                  </button>
                  <button 
                    className="card-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToBoard(player);
                    }}
                  >
                    📋 Add to Board
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
        )
        }
      </div>

      {/* Section 3 - Player Detail / Recruiting Profile */}
      {selectedPlayer && mainView === 'database' && (
        <div className="detail-overlay" onClick={() => setSelectedPlayer(null)}>
          <div className="recruiting-profile-panel" onClick={(e) => e.stopPropagation()}>
            {/* Header Summary */}
            <div className="profile-header-summary">
              <div className="profile-header-main">
              <h2>{selectedPlayer.name}</h2>
                <div className="profile-header-subtitle">
                  {selectedPlayer.position} · {selectedPlayer.division} {selectedPlayer.class} · {selectedPlayer.school} / {selectedPlayer.region || 'N/A'}
            </div>
            </div>
              <button className="close-btn" onClick={() => setSelectedPlayer(null)}>×</button>
            </div>
            
            <div className="profile-header-stats">
              <div className="profile-stat-item">
                <span className="stat-label">Status</span>
                <span className={`status-badge status-${(selectedPlayer.status || 'Unevaluated').toLowerCase()}`}>
                  {selectedPlayer.status || 'Unevaluated'}
                </span>
              </div>
              {selectedPlayer.lastUpdated && (
                <div className="profile-stat-item">
                  <span className="stat-label">Last Updated</span>
                  <span className="stat-value">{new Date(selectedPlayer.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
              {selectedPlayer.confidence && (
                <div className="profile-stat-item">
                  <span className="stat-label">Confidence %</span>
                  <span className="stat-value">{selectedPlayer.confidence}%</span>
                </div>
              )}
              <div className="profile-stat-item">
                <span className="stat-label">Final KPI</span>
                <span className="stat-value gold">{selectedPlayer.final_kpi || selectedPlayer.kpi || 'N/A'}</span>
              </div>
              {selectedPlayer.fit !== undefined && (
                <div className="profile-stat-item">
                  <span className="stat-label">Fit %</span>
                  <span className="stat-value">{selectedPlayer.fit}%</span>
                </div>
              )}
            </div>

            {/* Evaluation Report */}
            <div className="profile-evaluation-report">
              {selectedPlayer.status === 'Evaluated' ? (
                <>
                  <div className="evaluation-field">
                    <label>Role Projection</label>
                    <span>{selectedPlayer.roleProjection || 'Rotation'}</span>
                  </div>
                  <div className="evaluation-field">
                    <label>Archetype + Tags</label>
                    <span>{selectedPlayer.archetype || 'N/A'}{selectedPlayer.tags && ` · ${selectedPlayer.tags}`}</span>
                  </div>
                  {selectedPlayer.nil_value_suggestion && (
                    <div className="evaluation-field">
                      <label>NIL Value ($)</label>
                      <span>${selectedPlayer.nil_value_suggestion.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedPlayer.scholarship_suggestion !== undefined && (
                    <div className="evaluation-field">
                      <label>Scholarship Suggestion</label>
                      <span>{selectedPlayer.scholarship_suggestion} slot ≈ ${(selectedPlayer.scholarship_suggestion * 30000).toLocaleString()}</span>
                    </div>
                  )}
                  {(selectedPlayer.badges || selectedPlayer.flags) && (
                    <div className="evaluation-field">
                      <label>Badges / Flags</label>
                      <div className="badges-flags-list">
                        {selectedPlayer.badges?.map((badge, idx) => (
                          <span key={idx} className="badge">🏅 {badge}</span>
                        ))}
                        {selectedPlayer.flags?.map((flag, idx) => (
                          <span key={idx} className="flag">⚠ {flag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedPlayer.kpgLine && (
                    <div className="evaluation-field">
                      <label>KPG™ Line</label>
                      <span>{selectedPlayer.kpgLine}</span>
                    </div>
                  )}
                  {selectedPlayer.confidenceTier && (
                    <div className="evaluation-field">
                      <label>Confidence Tier</label>
                      <span>{selectedPlayer.confidenceTier}</span>
                    </div>
                  )}
                  {selectedPlayer.systemFitComment && (
                    <div className="evaluation-field">
                      <label>System Fit Comment</label>
                      <p className="fit-comment">{selectedPlayer.systemFitComment}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="evaluation-placeholder">
                  <p>Evaluation not run yet — click 🧠 Evaluate to generate KaNeXT Report.</p>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="profile-action-footer">
              <button className="secondary-btn" onClick={() => handleEvaluate(selectedPlayer)}>
                🧠 Evaluate in Player IQ™
              </button>
              <button className="secondary-btn" onClick={() => {
                handleAddToBoard(selectedPlayer);
                setSelectedPlayer(null);
              }}>
                📋 Add to Recruiting Board
              </button>
              {selectedPlayer.confidence >= 60 && selectedPlayer.recruitingStatus === 'Committed' && (
                <button className="secondary-btn" onClick={() => {
                  handleMoveToTeamIQ(selectedPlayer);
                  setSelectedPlayer(null);
                }}>
                  🏀 Add to Team IQ™
                </button>
              )}
              <button className="danger-btn" onClick={() => {
                if (window.confirm('Remove this player from feed?')) {
                  setSelectedPlayer(null);
                }
              }}>
                ❌ Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Prospect Modal */}
      {showAddProspectModal && (
        <div className="modal-overlay" onClick={() => setShowAddProspectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Prospect</h2>
              <button onClick={() => setShowAddProspectModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newProspect.name}
                  onChange={(e) => setNewProspect({ ...newProspect, name: e.target.value })}
                  placeholder="Player Name"
                />
              </div>
              <div className="form-group">
                <label>Position</label>
                <select
                  value={newProspect.position}
                  onChange={(e) => setNewProspect({ ...newProspect, position: e.target.value })}
                >
                  <option value="">Select Position</option>
                  <option value="PG">PG</option>
                  <option value="SG">SG</option>
                  <option value="SF">SF</option>
                  <option value="PF">PF</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div className="form-group">
                <label>Division</label>
                <select
                  value={newProspect.division}
                  onChange={(e) => setNewProspect({ ...newProspect, division: e.target.value })}
                >
                  <option value="">Select Division</option>
                  <option value="NCAA D1">NCAA D1</option>
                  <option value="NCAA D2">NCAA D2</option>
                  <option value="NCAA D3">NCAA D3</option>
                  <option value="NAIA">NAIA</option>
                  <option value="NCCAA">NCCAA</option>
                  <option value="JUCO">JUCO</option>
                  <option value="USCAA">USCAA</option>
                </select>
              </div>
              <div className="form-group">
                <label>School</label>
                <input
                  type="text"
                  value={newProspect.school}
                  onChange={(e) => setNewProspect({ ...newProspect, school: e.target.value })}
                  placeholder="School Name"
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={newProspect.city}
                  onChange={(e) => setNewProspect({ ...newProspect, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <select
                  value={newProspect.state}
                  onChange={(e) => setNewProspect({ ...newProspect, state: e.target.value })}
                >
                  <option value="">Select State</option>
                  <option value="TX">Texas</option>
                  <option value="CA">California</option>
                  <option value="FL">Florida</option>
                  <option value="NY">New York</option>
                  <option value="IL">Illinois</option>
                  <option value="PA">Pennsylvania</option>
                  <option value="OH">Ohio</option>
                  <option value="GA">Georgia</option>
                  <option value="NC">North Carolina</option>
                  <option value="MI">Michigan</option>
                </select>
              </div>
              <div className="form-group">
                <label>Class</label>
                <select
                  value={newProspect.class}
                  onChange={(e) => setNewProspect({ ...newProspect, class: e.target.value })}
                >
                  <option value="">Select Class</option>
                  <option value="FR">HS FR / College FR</option>
                  <option value="SO">HS SO / College SO</option>
                  <option value="JR">HS JR / College JR</option>
                  <option value="SR">HS SR / College SR</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowAddProspectModal(false)}>
                Cancel
              </button>
              <button className="primary-btn" onClick={handleAddProspect} disabled={!newProspect.name}>
                Add Prospect
              </button>
            </div>
          </div>
        </div>
      )}

      <CoachingIQDrawer 
        isOpen={showDrawer} 
        onClose={() => setShowDrawer(false)} 
      />

      {/* Section 5 - Coach K™ Recruiting Layer */}
      {isCoachKPinned && (
        <div className={`coach-k-recruiting-panel ${isCoachKCollapsed ? 'collapsed' : ''}`}>
          <div className="coach-k-header">
            <div className="coach-k-title">
              <span className="coach-k-icon">🧠</span>
              {!isCoachKCollapsed && <span>Coach K™ Recruiting</span>}
            </div>
            <div className="coach-k-actions">
              <button 
                className="coach-k-action-btn"
                onClick={() => setIsCoachKPinned(false)}
                title="Close"
              >
                ×
              </button>
              <button 
                className="coach-k-action-btn"
                onClick={() => setIsCoachKCollapsed(!isCoachKCollapsed)}
                title={isCoachKCollapsed ? "Expand" : "Collapse"}
              >
                {isCoachKCollapsed ? '→' : '←'}
              </button>
            </div>
          </div>

          {!isCoachKCollapsed && (
            <div className="coach-k-content">
              {/* Zone 1 - Live Recruiting Reactions */}
              <div className="coach-k-zone">
                <h3 className="coach-k-zone-title">Live Recruiting Reactions</h3>
                <div className="coach-k-insights">
                  {coachKInsights.length === 0 ? (
                    <div className="coach-k-empty">No recent activity</div>
                  ) : (
                    coachKInsights.map(insight => (
                      <div key={insight.id} className={`coach-k-insight coach-k-${insight.type}`}>
                        <span className="coach-k-insight-icon">{insight.icon}</span>
                        <span className="coach-k-insight-message">{insight.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Zone 2 - Class Composition Analysis */}
              <div className="coach-k-zone">
                <h3 className="coach-k-zone-title">Class Composition Analysis</h3>
                <div className="coach-k-composition">
                  <div className="composition-item">
                    <span className="composition-label">Guards:</span>
                    <span className="composition-value">{classComposition.guards}</span>
                  </div>
                  <div className="composition-item">
                    <span className="composition-label">Forwards:</span>
                    <span className="composition-value">{classComposition.forwards}</span>
                  </div>
                  <div className="composition-item">
                    <span className="composition-label">Bigs:</span>
                    <span className="composition-value">{classComposition.bigs}</span>
                  </div>
                </div>
                {classComposition.forwards + classComposition.bigs < classComposition.guards && (
                  <div className="coach-k-alert">
                    ⚠ Frontcourt depth below target — {classComposition.guards} Guards, {classComposition.forwards} Forward{classComposition.forwards !== 1 ? 's' : ''}, {classComposition.bigs} Big{classComposition.bigs !== 1 ? 's' : ''}.
                  </div>
                )}
              </div>

              {/* Zone 3 - Strategic Insight / Next Step */}
              <div className="coach-k-zone">
                <h3 className="coach-k-zone-title">Strategic Insight</h3>
                {priorityInactivityCheck ? (
                  <div className="coach-k-strategic">
                    <p>⭐ Priority recruit uncontacted {priorityInactivityCheck.daysSince} days — follow-up to sustain interest.</p>
                  </div>
                ) : budgetSummary.committed > 0 ? (
                  <div className="coach-k-strategic">
                    <p>Recruiting class stabilized · {budgetSummary.committed} commit{budgetSummary.committed !== 1 ? 's' : ''} · Budget {Math.max(budgetSummary.scholarshipPercent, budgetSummary.nilPercent)}% used · Avg KPI {budgetSummary.avgKPI} · Fit {budgetSummary.avgFit}%.</p>
                  </div>
                ) : (
                  <div className="coach-k-strategic">
                    <p>Build your recruiting class — evaluate prospects in Player IQ™ to unlock verified metrics.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecruitingIQPage;

