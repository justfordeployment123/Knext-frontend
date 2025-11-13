import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { isAuthenticated } from '../services/authService';
import CoachingIQDrawer from '../components/CoachingIQDrawer';
import CoachKAssistant from '../components/CoachKAssistant';
import Icon from '../components/Icon';
import './PlayerIQPage.css';

const PlayerIQPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { coachProfile, coachingBias, addPlayerProfile, addToRoster, teamState, playerProfiles, coachKState, setCoachKState, addCoachKMessage } = useApp();
  const [fadeIn, setFadeIn] = useState(false);
  const [playerIQStage, setPlayerIQStage] = useState('entry'); // entry, intro, scope, evaluation, decision, progress, transition
  const [verifiedPlayersCount, setVerifiedPlayersCount] = useState(0);
  const [rosterMode, setRosterMode] = useState('demo'); // demo, hybrid, live
  
  const [searchMode, setSearchMode] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchData, setSearchData] = useState({
    playerName: '',
    school: '',
    classYear: '',
    position: '',
    hintTags: [],
    sources: {
      official: true,
      recruiting: true,
      media: true,
      social: true
    },
    regionBias: ''
  });

  const [scopeResult, setScopeResult] = useState(null);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [coachNotes, setCoachNotes] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [hasManuallyClosedCoachK, setHasManuallyClosedCoachK] = useState(() => {
    return localStorage.getItem('playerIQ_coachK_closed') === 'true';
  });
  const [hasManuallyClosedDrawer, setHasManuallyClosedDrawer] = useState(() => {
    return localStorage.getItem('playerIQ_drawer_closed') === 'true';
  });
  const isInitialMountRef = useRef(true);
  const prevCoachKOpenRef = useRef(null);

  const handleRunScope = async (e) => {
    e.preventDefault();
    
    // Validate minimum 3 characters for player name
    if (searchData.playerName.trim().length < 3) {
      alert('Player name must be at least 3 characters');
      return;
    }

    setLoading(true);
    setPlayerIQStage('scope');

    // Stage 3: Lifeline Scope
    addCoachKMessage({
      id: 'PIQ_STAGE3_1',
      speaker: 'Coach K',
      message: 'Scraping verified data sources...',
      type: 'info'
    });

    console.log('[LOGIC HOOK: handleRunScope] Running Lifeline Scope with parameters:', searchData);

    // Simulate AI scraping with coaching bias applied
    setTimeout(() => {
      const nilBands = ['Low', 'Baseline', 'Solid', 'High'];
      const nilReadiness = Math.floor(Math.random() * 4);
      const confidence = Math.floor(Math.random() * 20) + 80;
      
      const mockResult = {
        name: searchData.playerName,
        school: searchData.school || 'Sample University',
        position: searchData.position || 'Guard',
        autoDetectedPosition: searchData.position || 'Guard',
        classYear: searchData.classYear || 'Junior',
        confidence: confidence,
        image: null,
        nilReadiness: nilBands[nilReadiness],
        nilReadinessValue: nilReadiness + 1,
        redFlags: [],
        redFlagsSummary: 'None',
        eligibility: 'Active',
        levelContext: 'D2 Starter / D1 Rotation',
        sources: [
          { name: 'Official Roster', agreement: true },
          { name: '247Sports', agreement: true },
          { name: 'ESPN', agreement: true }
        ],
        sourceAgreement: '✓✓✓'
      };

      console.log('[LOGIC HOOK: handleRunScope] Scope results:', mockResult);
      setScopeResult(mockResult);
      setSearchMode(false);
      setLoading(false);

      // Report Confidence % on completion
      addCoachKMessage({
        id: 'PIQ_STAGE3_2',
        speaker: 'Coach K',
        message: `Confidence ${mockResult.confidence}%. Ready to generate KPI and Fit Score?`,
        type: 'success'
      });
    }, 1500);
  };

  const handleAddHintTag = (tag) => {
    if (!searchData.hintTags.includes(tag)) {
      setSearchData({
        ...searchData,
        hintTags: [...searchData.hintTags, tag]
      });
    }
  };

  const handleRemoveHintTag = (tag) => {
    setSearchData({
      ...searchData,
      hintTags: searchData.hintTags.filter(t => t !== tag)
    });
  };

  const handleToggleSource = (source) => {
    setSearchData({
      ...searchData,
      sources: {
        ...searchData.sources,
        [source]: !searchData.sources[source]
      }
    });
  };

  const handleSaveScopeOnly = () => {
    if (scopeResult) {
      const scopedRecord = {
        ...scopeResult,
        status: 'Scoped',
        notes: coachNotes,
        attachments: attachments
      };
      console.log('[LOGIC HOOK: Save Scope] Saving scoped record:', scopedRecord);
      alert('✅ Scope saved successfully');
    }
  };

  const handleEditDisambiguation = () => {
    setSearchMode(true);
    setScopeResult(null);
  };

  const handleRunEvaluation = () => {
    setLoading(true);
    setPlayerIQStage('evaluation');

    // Stage 4: Full Evaluation
    addCoachKMessage({
      id: 'PIQ_STAGE4_1',
      speaker: 'Coach K',
      message: 'Running Full Evaluation. Applying Confidence Gate thresholds and Coaching IQ bias...',
      type: 'info'
    });

    console.log('[LOGIC HOOK: handleRunEvaluation] Running Full Evaluation for player:', scopeResult?.name);

    setTimeout(() => {
      const confidence = scopeResult.confidence;
      const finalKPI = parseFloat((Math.random() * 20 + 70).toFixed(1));
      const fit = parseInt((Math.random() * 20 + 70).toFixed(0));
      
      // Calculate Confidence Gate tier
      let confidenceTier = 'Full Trust';
      let confidenceLabel = 'Full Trust';
      if (confidence < 60) {
        confidenceTier = 'Insufficient';
        confidenceLabel = 'Insufficient Sample';
      } else if (confidence < 70) {
        confidenceTier = 'Low';
        confidenceLabel = 'Low Confidence';
      } else if (confidence < 80) {
        confidenceTier = 'Limited';
        confidenceLabel = 'Limited';
      } else if (confidence < 90) {
        confidenceTier = 'Trusted';
        confidenceLabel = 'Trusted';
      }

      // Calculate financial values based on Coaching IQ bias
      const scholarshipCap = coachingBias?.scholarshipCap || 12;
      const nilPool = coachingBias?.nilPool || 50000;
      const rosterSize = 12; // Default, could come from teamState
      
      const scholarshipSuggestion = Math.round((finalKPI / 100) * scholarshipCap * (10000 / rosterSize));
      const nilValueSuggestion = Math.round((scopeResult.nilReadinessValue || 5) * (confidence / 100) * (nilPool / rosterSize));

      // Determine if Pro KPI should be shown
      const showProKPI = confidence >= 80 && (scopeResult.classYear?.includes('JR') || scopeResult.classYear?.includes('SR') || scopeResult.classYear === 'Pro');
      
      const evaluation = {
        ...scopeResult,
        confidence: confidence,
        confidenceTier: confidenceTier,
        confidenceLabel: confidenceLabel,
        dataRecency: 'Current Season',
        finalKPI: finalKPI,
        fit: fit,
        roleProjection: finalKPI > 80 ? 'Starter' : finalKPI > 70 ? 'Rotation' : 'Depth',
        archetype: 'Offensive Connector',
        archetypeTags: ['Ball Handler', 'Spacing'],
        nilReadiness: scopeResult.nilReadinessValue || 5,
        divisionPlacement: 'NCAA D2 Starter / D1 Rotation',
        scholarshipSuggestion: scholarshipSuggestion,
        nilValueSuggestion: nilValueSuggestion,
        badges: confidence >= 80 ? ['🏅 Sniper', '⚡ High IQ'] : ['⚡ High IQ'],
        flags: [],
        kpgLine: `${(finalKPI * 0.2).toFixed(1)} pts · ${(finalKPI * 0.06).toFixed(1)} ast · ${(finalKPI * 0.03).toFixed(1)} reb`,
        overridesApplied: false,
        showProKPI: showProKPI,
        proKPI: showProKPI ? parseFloat((finalKPI + 5).toFixed(1)) : null,
        proRoleProjection: showProKPI ? 'Connector Wing' : null,
        proTierPlacement: showProKPI ? 'T2B' : null,
        marketValueProjection: showProKPI ? Math.round(finalKPI * 15000) : null,
        marketNotes: showProKPI ? 'Transferable skills, international comps available' : null,
        timestamp: new Date().toISOString()
      };

      console.log('[LOGIC HOOK: handleRunEvaluation] Evaluation complete:', evaluation);
      setEvaluationResult(evaluation);
      setLoading(false);
      setPlayerIQStage('decision');

      // Stage 4: Evaluation Summary
      const confidenceBandLabel = getConfidenceBandLabel(evaluation.confidence);
      addCoachKMessage({
        id: 'PIQ_STAGE4_2',
        speaker: 'Coach K',
        message: `Evaluation complete — Confidence ${evaluation.confidence}%, Fit ${evaluation.fit}%, ${confidenceBandLabel}. Recommended Scholarship: $${evaluation.scholarshipSuggestion.toLocaleString()} · Projected NIL: $${evaluation.nilValueSuggestion.toLocaleString()}.`,
        type: 'success'
      });

      // Stage 5: Decision prompt
      setTimeout(() => {
        addCoachKMessage({
          id: 'PIQ_STAGE5_1',
          speaker: 'Coach K',
          message: 'Add to Recruiting IQ™ or Team IQ™?',
          type: 'prompt'
        });
      }, 1000);
    }, 2000);
  };

  const handleSyncToTeamIQ = () => {
    if (evaluationResult && evaluationResult.confidence >= 60) {
      const playerProfile = {
        id: Date.now().toString(),
        name: evaluationResult.name,
        team: evaluationResult.school,
        position: evaluationResult.position,
        confidence: evaluationResult.confidence,
        final_kpi: evaluationResult.finalKPI,
        fit: evaluationResult.fit,
        scholarship_suggestion: evaluationResult.scholarshipSuggestion,
        nil_value_suggestion: evaluationResult.nilValueSuggestion,
        bias_profile_id: coachProfile?.email || 'default',
        synced_to: ['Team IQ'],
        status: 'Synced',
        roster_source: 'coach',
        timestamp: evaluationResult.timestamp
      };

      console.log('[LOGIC HOOK: Sync] Syncing player to Team IQ:', playerProfile);
      addPlayerProfile(playerProfile);
      addToRoster(playerProfile);
      
      // Stage 5: Sync confirmation
      const newCount = verifiedPlayersCount + 1;
      setPlayerIQStage('progress');
      
      // Show confirmation toast
      const toast = document.createElement('div');
      toast.className = 'sync-toast';
      toast.textContent = '✅ Player Synced';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => document.body.removeChild(toast), 300);
        }, 2000);
      }, 100);

      // Stage 6: Roster Progress
      setTimeout(() => {
        if (newCount < 10) {
          addCoachKMessage({
            id: 'PIQ_STAGE6_1',
            speaker: 'Coach K',
            message: `Player synced. You now have ${newCount} verified player${newCount !== 1 ? 's' : ''} — Team IQ™ preview available.`,
            type: 'success'
          });
          if (newCount >= 4 && newCount < 10) {
            addCoachKMessage({
              id: 'PIQ_STAGE6_2',
              speaker: 'Coach K',
              message: 'Mixing verified and benchmark players. Team IQ™ unlocks after 10 verified players.',
              type: 'info'
            });
          }
        } else {
          addCoachKMessage({
            id: 'PIQ_STAGE6_3',
            speaker: 'Coach K',
            message: 'Roster complete — Team IQ™ now fully live!',
            type: 'success'
          });
          setPlayerIQStage('transition');
        }
      }, 500);
      
      handleReset();
    }
  };

  const handleSyncToRecruitingIQ = () => {
    if (evaluationResult && evaluationResult.confidence >= 60) {
      const playerProfile = {
        id: Date.now().toString(),
        name: evaluationResult.name,
        team: evaluationResult.school,
        position: evaluationResult.position,
        confidence: evaluationResult.confidence,
        final_kpi: evaluationResult.finalKPI,
        fit: evaluationResult.fit,
        scholarship_suggestion: evaluationResult.scholarshipSuggestion,
        nil_value_suggestion: evaluationResult.nilValueSuggestion,
        bias_profile_id: coachProfile?.email || 'default',
        synced_to: ['Recruiting IQ'],
        status: 'Synced',
        roster_source: 'coach',
        timestamp: evaluationResult.timestamp
      };

      console.log('[LOGIC HOOK: Sync] Syncing player to Recruiting IQ:', playerProfile);
      
      // Stage 5: Sync confirmation
      const newCount = verifiedPlayersCount + 1;
      setPlayerIQStage('progress');
      
      // Show confirmation toast
      const toast = document.createElement('div');
      toast.className = 'sync-toast';
      toast.textContent = '✅ Player Synced';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => {
          toast.classList.remove('show');
          setTimeout(() => document.body.removeChild(toast), 300);
        }, 2000);
      }, 100);

      // Stage 6: Roster Progress
      setTimeout(() => {
        if (newCount < 10) {
          addCoachKMessage({
            id: 'PIQ_STAGE6_1',
            speaker: 'Coach K',
            message: `Player synced. You now have ${newCount} verified player${newCount !== 1 ? 's' : ''} — Team IQ™ preview available.`,
            type: 'success'
          });
        } else {
          addCoachKMessage({
            id: 'PIQ_STAGE6_3',
            speaker: 'Coach K',
            message: 'Roster complete — Team IQ™ now fully live!',
            type: 'success'
          });
          setPlayerIQStage('transition');
        }
      }, 500);
      
      handleReset();
    }
  };

  const getConfidenceBandLabel = (confidence) => {
    if (confidence >= 90) return 'Full Trust';
    if (confidence >= 80) return 'Trusted';
    if (confidence >= 70) return 'Limited';
    if (confidence >= 60) return 'Low Confidence';
    return 'Insufficient Sample';
  };

  const getConfidenceBandColor = (confidence) => {
    if (confidence >= 90) return '#D4AF37';
    if (confidence >= 80) return '#D4AF37';
    if (confidence >= 70) return 'rgba(255, 255, 255, 0.7)';
    if (confidence >= 60) return '#FF4D4D';
    return '#FF4D4D';
  };

  const handleReset = () => {
    setSearchMode(true);
    setScopeResult(null);
    setEvaluationResult(null);
    setShowAdvancedFilters(false);
    setCoachNotes('');
    setAttachments([]);
    setSearchData({ 
      playerName: '', 
      school: '', 
      classYear: '', 
      position: '',
      hintTags: [],
      sources: {
        official: true,
        recruiting: true,
        media: true,
        social: true
      },
      regionBias: ''
    });
  };

  // Stock roster for demo mode
  const stockRoster = [
    { id: 'stock_1', name: 'Stock PG', position: 'PG', roster_source: 'demo', confidence: 85, final_kpi: 75 },
    { id: 'stock_2', name: 'Stock SG', position: 'SG', roster_source: 'demo', confidence: 82, final_kpi: 73 },
    { id: 'stock_3', name: 'Stock SF', position: 'SF', roster_source: 'demo', confidence: 80, final_kpi: 71 },
    { id: 'stock_4', name: 'Stock PF', position: 'PF', roster_source: 'demo', confidence: 78, final_kpi: 69 },
    { id: 'stock_5', name: 'Stock C', position: 'C', roster_source: 'demo', confidence: 76, final_kpi: 67 },
    { id: 'stock_6', name: 'Stock PG2', position: 'PG', roster_source: 'demo', confidence: 74, final_kpi: 65 },
    { id: 'stock_7', name: 'Stock SG2', position: 'SG', roster_source: 'demo', confidence: 72, final_kpi: 63 },
    { id: 'stock_8', name: 'Stock SF2', position: 'SF', roster_source: 'demo', confidence: 70, final_kpi: 61 },
    { id: 'stock_9', name: 'Stock PF2', position: 'PF', roster_source: 'demo', confidence: 68, final_kpi: 59 },
    { id: 'stock_10', name: 'Stock C2', position: 'C', roster_source: 'demo', confidence: 66, final_kpi: 57 },
    { id: 'stock_11', name: 'Stock Bench1', position: 'PG', roster_source: 'demo', confidence: 64, final_kpi: 55 },
    { id: 'stock_12', name: 'Stock Bench2', position: 'SG', roster_source: 'demo', confidence: 62, final_kpi: 53 }
  ];

  // Calculate verified players count and roster mode
  useEffect(() => {
    const verified = playerProfiles.filter(p => p.confidence >= 60 && p.roster_source !== 'demo');
    const count = verified.length;
    setVerifiedPlayersCount(count);

    if (count === 0) {
      setRosterMode('demo');
    } else if (count < 10) {
      setRosterMode('hybrid');
    } else {
      setRosterMode('live');
    }
  }, [playerProfiles]);

  // Track when Coach K is manually closed
  useEffect(() => {
    // Initialize on first render
    if (prevCoachKOpenRef.current === null) {
      prevCoachKOpenRef.current = coachKState.isOpen;
      return;
    }
    
    // If Coach K was open and is now closed (not just minimized), user manually closed it
    if (prevCoachKOpenRef.current === true && coachKState.isOpen === false && !coachKState.isMinimized) {
      setHasManuallyClosedCoachK(true);
      localStorage.setItem('playerIQ_coachK_closed', 'true');
    }
    prevCoachKOpenRef.current = coachKState.isOpen;
  }, [coachKState.isOpen, coachKState.isMinimized]);

  // Stage 1: Entry - Validate coaching_bias
  useEffect(() => {
    if (!isAuthenticated() || !coachProfile) {
      navigate('/login');
      return;
    }

    // Fade-in animation on mount (150ms as per spec)
    setTimeout(() => setFadeIn(true), 100);

    // Only auto-open on initial mount, not on every dependency change
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;

      // Auto-open Coach K on PlayerIQ page ONLY if user hasn't manually closed it
      if (!hasManuallyClosedCoachK) {
        setTimeout(() => {
          setCoachKState(prev => ({
            ...prev,
            isOpen: true,
            isMinimized: false
          }));
        }, 500);
      }

      // Stage 1: Entry validation
      if (!coachingBias) {
        setPlayerIQStage('entry');
        // Only auto-open drawer if user hasn't manually closed it
        if (!hasManuallyClosedDrawer) {
          setTimeout(() => {
            addCoachKMessage({
              id: 'PIQ_STAGE1_1',
              speaker: 'Coach K',
              message: 'Set Coaching IQ to continue. Opening Coaching IQ drawer...',
              type: 'warning'
            });
            setTimeout(() => {
              setShowDrawer(true);
              const event = new CustomEvent('openCoachingIQDrawer');
              window.dispatchEvent(event);
            }, 500);
          }, 600);
        }
      } else {
        // Check if first-time user
        const hasPlayers = playerProfiles.filter(p => p.roster_source !== 'demo').length > 0;
        if (!hasPlayers && !hasManuallyClosedCoachK) {
          setPlayerIQStage('intro');
          setTimeout(() => {
            addCoachKMessage({
              id: 'PIQ_STAGE1_2',
              speaker: 'Coach K',
              message: 'Start by evaluating your first player. Use the search form above to begin.',
              type: 'info'
            });
          }, 600);
        } else {
          setPlayerIQStage('ready');
        }
      }
    }

    // Listen for Coaching IQ drawer open event
    const handleOpenDrawer = () => {
      setShowDrawer(true);
    };

    window.addEventListener('openCoachingIQDrawer', handleOpenDrawer);

    return () => {
      window.removeEventListener('openCoachingIQDrawer', handleOpenDrawer);
    };
  }, [coachProfile, navigate, setCoachKState, hasManuallyClosedCoachK, hasManuallyClosedDrawer]);

  // Monitor coachingBias changes (only for stage transitions, not auto-opening)
  useEffect(() => {
    if (coachingBias && playerIQStage === 'entry') {
      setPlayerIQStage('intro');
      if (!hasManuallyClosedCoachK) {
        addCoachKMessage({
          id: 'PIQ_STAGE1_3',
          speaker: 'Coach K',
          message: 'Great! Your Coaching IQ is set. Now let\'s evaluate your first player.',
          type: 'success'
        });
      }
    }
  }, [coachingBias, playerIQStage, addCoachKMessage, hasManuallyClosedCoachK]);

  const isActiveRoute = (path) => {
    // Only highlight if we're actually on that route
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleOpenCoachingIQ = () => {
    if (!coachingBias) {
      const event = new CustomEvent('openCoachingIQDrawer');
      window.dispatchEvent(event);
      setShowDrawer(true);
    } else {
      setShowDrawer(true);
    }
  };

  if (!isAuthenticated() || !coachProfile) {
    return null;
  }

  return (
    <div className={`player-iq-page ${fadeIn ? 'fade-in' : ''}`}>
      {/* Header */}
      <header className="player-iq-header">
        <div className="header-left">
          <h1 className="header-title">PLAYER IQ™ EVALUATOR</h1>
          <p className="subtitle">Run Lifeline Scope and Full Evaluation on any player.</p>
          <div className="context-line">
            <span>Team: {coachProfile?.team || 'Not Set'}</span>
            <span className="context-divider">·</span>
            <span>Offense: {coachingBias?.offensiveSystem || coachProfile?.offense || 'Not Set'}</span>
            <span className="context-divider">·</span>
            <span>Defense: {coachingBias?.defensiveSystem || coachProfile?.defense || 'Not Set'}</span>
            <span className="context-divider">·</span>
            <span>Division: {coachProfile?.division || 'Not Set'}</span>
          </div>
          <div 
            className={`coaching-iq-chip ${coachingBias ? 'active' : 'incomplete'}`}
            onClick={handleOpenCoachingIQ}
            title={coachingBias ? "Coaching IQ Active" : "Set Up Required - Click to configure"}
          >
            <span className="chip-icon">🧠</span>
            <span className="chip-text">{coachingBias ? 'Coaching IQ Active' : 'Set Up Required'}</span>
          </div>
        </div>
        <div className="header-right">
          <button 
            className={`nav-btn ${isActiveRoute('/team-iq') ? 'active' : ''}`} 
            onClick={() => navigate('/team-iq')}
            title="Team IQ™"
          >
            <Icon name="team" size={16} />
            <span>Team IQ™</span>
          </button>
          <button 
            className={`nav-btn ${isActiveRoute('/recruiting-iq') ? 'active' : ''}`} 
            onClick={() => navigate('/recruiting-iq')}
            title="Recruiting IQ™"
          >
            <Icon name="clipboard" size={16} />
            <span>Recruiting IQ™</span>
          </button>
          <button 
            className={`nav-btn ${isActiveRoute('/office') ? 'active' : ''}`} 
            onClick={() => navigate('/office')}
            title="Return to Office"
          >
            <Icon name="home" size={16} />
            <span>Return to Office</span>
          </button>
        </div>
      </header>

      {/* Roster Progress Indicator */}
      <div className="roster-progress-bar">
        <div className="progress-header">
          <span className="progress-label">📊 Verified Players: {verifiedPlayersCount}/10</span>
          <span className="roster-mode-badge">{rosterMode === 'demo' ? 'Demo Mode' : rosterMode === 'hybrid' ? 'Hybrid Mode' : 'Live Mode'}</span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${Math.min((verifiedPlayersCount / 10) * 100, 100)}%` }}
          ></div>
        </div>
        {verifiedPlayersCount < 10 && (
          <p className="progress-note">
            {verifiedPlayersCount === 0
              ? 'Demo mode active — evaluate players to personalize results.'
              : verifiedPlayersCount < 4 
                ? 'Demo mode active — evaluate players to personalize results.'
                : 'Mixing verified and benchmark players. Team IQ™ unlocks after 10 verified players.'}
          </p>
        )}
        {verifiedPlayersCount >= 10 && (
          <p className="progress-note success">
            Roster complete — Team IQ™ now fully live!
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="player-iq-content">
        {/* Search Card */}
        {searchMode && !scopeResult && (
          <div className={`search-card ${loading ? 'fade-out' : ''}`}>
            <h2>Lifeline Scope</h2>
            <form onSubmit={handleRunScope}>
              <div className="form-group">
                <label>Player Name *</label>
                <input
                  type="text"
                  placeholder="Minimum 3 characters"
                  value={searchData.playerName}
                  onChange={(e) => setSearchData({ ...searchData, playerName: e.target.value })}
                  minLength={3}
                  required
                />
              </div>

              <div className="form-group">
                <label>Program / School (optional)</label>
                <input
                  type="text"
                  placeholder="Improves accuracy of scrape"
                  value={searchData.school}
                  onChange={(e) => setSearchData({ ...searchData, school: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Class / Year (optional)</label>
                <select
                  value={searchData.classYear}
                  onChange={(e) => setSearchData({ ...searchData, classYear: e.target.value })}
                >
                  <option value="">Select Class</option>
                  <option value="HS FR">HS Freshman</option>
                  <option value="HS SO">HS Sophomore</option>
                  <option value="HS JR">HS Junior</option>
                  <option value="HS SR">HS Senior</option>
                  <option value="Prep">Prep</option>
                  <option value="FR">College Freshman</option>
                  <option value="SO">College Sophomore</option>
                  <option value="JR">College Junior</option>
                  <option value="SR">College Senior</option>
                  <option value="Pro">Pro</option>
                </select>
              </div>

              <div className="form-group">
                <label>Hint Tags (optional)</label>
                <div className="hint-tags-input">
                  <input
                    type="text"
                    placeholder="Position, city, state, team nickname"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        e.preventDefault();
                        handleAddHintTag(e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                  />
                  <div className="hint-tags-list">
                    {searchData.hintTags.map((tag, idx) => (
                      <span key={idx} className="hint-tag">
                        {tag}
                        <button type="button" onClick={() => handleRemoveHintTag(tag)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {showAdvancedFilters && (
                <div className="advanced-filters">
                  <div className="form-group">
                    <label>Source Controls</label>
                    <div className="source-toggles">
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={searchData.sources.official}
                          onChange={() => handleToggleSource('official')}
                        />
                        <span>Official Sites</span>
                      </label>
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={searchData.sources.recruiting}
                          onChange={() => handleToggleSource('recruiting')}
                        />
                        <span>Recruiting Services</span>
                      </label>
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={searchData.sources.media}
                          onChange={() => handleToggleSource('media')}
                        />
                        <span>Media</span>
                      </label>
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={searchData.sources.social}
                          onChange={() => handleToggleSource('social')}
                        />
                        <span>Social / Video</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Region Bias (optional)</label>
                    <select
                      value={searchData.regionBias}
                      onChange={(e) => setSearchData({ ...searchData, regionBias: e.target.value })}
                    >
                      <option value="">Select Region</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="primary-btn" disabled={loading || searchData.playerName.length < 3}>
                  {loading ? 'Running Scope...' : 'Run Lifeline Scope'}
                </button>
                <button 
                  type="button" 
                  className="secondary-btn"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  {showAdvancedFilters ? 'Hide' : 'Advanced Filters'}
                </button>
                <button 
                  type="button" 
                  className="secondary-btn"
                  onClick={handleReset}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Scope Results */}
        {scopeResult && !evaluationResult && (
          <div className="scope-results slide-up">
            <h2>Lifeline Scope Results</h2>
            <div className="scope-results-panel">
              {/* Left Column - Summary */}
              <div className="scope-summary">
                <div className="confidence-section">
                  <label>Confidence %</label>
                  <div className="confidence-value">{scopeResult.confidence}%</div>
                  <div className={`progress-bar ${scopeResult.confidence < 70 ? 'low' : ''}`}>
                    <div 
                      className="progress-fill" 
                      style={{ width: `${scopeResult.confidence}%` }}
                    ></div>
                  </div>
                  <p className="confidence-note">Derived from cross-source agreement + sample size</p>
                </div>

                <div className="metric-section">
                  <div className="metric-item">
                    <label>Auto-Detected Position</label>
                    <div className="metric-value">{scopeResult.autoDetectedPosition || scopeResult.position}</div>
                    <p className="metric-note">System-weighted role (bias-adjusted)</p>
                  </div>

                  <div className="metric-item">
                    <label>Eligibility Status</label>
                    <div className={`metric-value eligibility-${scopeResult.eligibility.toLowerCase()}`}>
                      {scopeResult.eligibility}
                    </div>
                  </div>

                  <div className="metric-item">
                    <label>NIL Readiness Band</label>
                    <div className={`metric-value nil-${scopeResult.nilReadiness.toLowerCase()}`}>
                      {scopeResult.nilReadiness}
                    </div>
                  </div>

                  <div className="metric-item">
                    <label>Red Flags Summary</label>
                    <div className="metric-value">{scopeResult.redFlagsSummary || 'None'}</div>
                  </div>

                  <div className="metric-item">
                    <label>Level Context</label>
                    <div className="metric-value">{scopeResult.levelContext}</div>
                  </div>
                </div>
              </div>

              {/* Right Column - Identity & Details */}
              <div className="scope-details">
                <div className="identity-card">
                  <div className="player-avatar-large">
                    {scopeResult.image ? (
                      <img src={scopeResult.image} alt={scopeResult.name} />
                    ) : (
                      <span>{scopeResult.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="player-info">
                    <h3>{scopeResult.name}</h3>
                    <p>{scopeResult.school || 'Program Not Specified'}</p>
                    <p>{scopeResult.classYear || 'Class Not Specified'}</p>
                  </div>
                </div>

                <div className="source-preview">
                  <label>Source Preview</label>
                  <div className="source-agreement">{scopeResult.sourceAgreement || '✓✓✓'}</div>
                  <div className="sources-list">
                    {scopeResult.sources?.map((source, idx) => (
                      <div key={idx} className="source-item">
                        <span className="source-name">{source.name}</span>
                        <span className="source-check">{source.agreement ? '✓' : '○'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="coach-notes-section">
                  <label>Coach Notes (optional)</label>
                  <textarea
                    value={coachNotes}
                    onChange={(e) => setCoachNotes(e.target.value)}
                    placeholder="Store notes to player_profile.notes"
                    rows={3}
                  />
                </div>

                <div className="attachments-section">
                  <label>Attachments (optional)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      setAttachments([...attachments, ...files]);
                    }}
                  />
                  {attachments.length > 0 && (
                    <div className="attachments-list">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="attachment-item">
                          <span>{file.name}</span>
                          <button type="button" onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}>
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="scope-actions">
              <button className="secondary-btn" onClick={handleEditDisambiguation}>
                Edit Disambiguation
              </button>
              <button className="secondary-btn" onClick={handleSaveScopeOnly}>
                Save Scope Only
              </button>
              <button className="primary-btn" onClick={handleRunEvaluation} disabled={loading}>
                {loading ? 'Evaluating...' : 'Run Full Evaluation'}
              </button>
            </div>
          </div>
        )}

        {/* Evaluation Results - Section 3 */}
        {evaluationResult && (
          <div className="evaluation-results fade-in">
            {/* Fixed Header Row */}
            <div className="evaluation-header-row">
              <span className="header-player-name">{evaluationResult.name}</span>
              <span className="header-divider">·</span>
              <span className="header-program">{evaluationResult.school || 'Program Not Specified'}</span>
              <span className="header-divider">·</span>
              <span className="header-confidence">Confidence: {evaluationResult.confidence}%</span>
            </div>

            {/* Module 1: Confidence Gate Summary */}
            <div className="confidence-gate-module">
              <h2>Confidence Gate Summary</h2>
              <div className="confidence-gate-card">
                <div className="confidence-gate-main">
                  <div className="confidence-display">
                    <label>Confidence %</label>
                    <div className="confidence-value-large" style={{ color: getConfidenceBandColor(evaluationResult.confidence) }}>
                      {evaluationResult.confidence}%
                    </div>
                    <div className={`confidence-band ${evaluationResult.confidenceTier.toLowerCase()}`}>
                      {evaluationResult.confidenceLabel}
                    </div>
                    <div className={`progress-bar ${evaluationResult.confidence < 70 ? 'low' : ''}`}>
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${evaluationResult.confidence}%`,
                          backgroundColor: getConfidenceBandColor(evaluationResult.confidence)
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="confidence-details">
                    <div className="detail-item">
                      <label>Data Recency</label>
                      <div className="detail-value">{evaluationResult.dataRecency}</div>
                    </div>
                    <div className="detail-item">
                      <label>Threshold Band</label>
                      <div className="detail-value">{getConfidenceBandLabel(evaluationResult.confidence)}</div>
                    </div>
                  </div>
                </div>

                {evaluationResult.confidence < 60 && (
                  <div className="flag-notice insufficient">
                    <span className="flag-icon">⚠</span>
                    <span>Insufficient Sample — Evaluation Limited.</span>
                  </div>
                )}
                {evaluationResult.confidence >= 60 && evaluationResult.confidence < 70 && (
                  <div className="flag-notice low">
                    <span className="flag-icon">⚠</span>
                    <span>Low Confidence — KPI outputs restricted.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Module 2: Final KPI Report */}
            <div className="kpi-report-module">
              <h2>Final KPI Report</h2>
              
              {/* College KPI Report (default view) */}
              <div className="kpi-report-card">
                <div className="kpi-report-header">
                  <h3>College KPI Report</h3>
                </div>

                <div className="kpi-main-display">
                  <div className="kpi-score-large">{evaluationResult.finalKPI}</div>
                  <div className="kpi-label-large">Final KPI</div>
                  <p className="kpi-description">Weighted composite (traits × bias × confidence)</p>
                </div>

                <div className="kpi-details-grid">
                  <div className="kpi-detail-item">
                    <label>Role Projection</label>
                    <div className="kpi-detail-value">{evaluationResult.roleProjection}</div>
                    <p className="kpi-detail-note">Based on division percentile</p>
                  </div>

                  <div className="kpi-detail-item">
                    <label>Archetype & Tags</label>
                    <div className="kpi-detail-value">{evaluationResult.archetype}</div>
                    <div className="archetype-tags">
                      {evaluationResult.archetypeTags?.map((tag, i) => (
                        <span key={i} className="archetype-tag">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="kpi-detail-item">
                    <label>NIL Readiness</label>
                    <div className="kpi-detail-value">{evaluationResult.nilReadiness}/10</div>
                    <p className="kpi-detail-note">Banded score from verified exposure</p>
                  </div>

                  <div className="kpi-detail-item">
                    <label>Division Placement</label>
                    <div className="kpi-detail-value">{evaluationResult.divisionPlacement}</div>
                  </div>

                  <div className="kpi-detail-item">
                    <label>Fit %</label>
                    <div className="kpi-detail-value">{evaluationResult.fit}%</div>
                    <p className="kpi-detail-note">System alignment strength</p>
                  </div>

                  <div className="kpi-detail-item">
                    <label>Badges / Flags</label>
                    <div className="badges-list">
                      {evaluationResult.badges?.map((badge, i) => (
                        <span key={i} className="badge">{badge}</span>
                      ))}
                      {evaluationResult.flags?.length === 0 && <span className="no-flags">No flags</span>}
                    </div>
                  </div>
                </div>

                <div className="financial-recommendations">
                  <h4>Financial Recommendations</h4>
                  <div className="financial-grid">
                    <div className="financial-item">
                      <span className="financial-icon">💰</span>
                      <div className="financial-content">
                        <label>Scholarship Suggestion ($)</label>
                        <div className="financial-amount">${evaluationResult.scholarshipSuggestion.toLocaleString()}</div>
                        <p className="financial-note">KPI percentile × Scholarship Cap ÷ Roster Size</p>
                      </div>
                    </div>
                    <div className="financial-item">
                      <span className="financial-icon">💵</span>
                      <div className="financial-content">
                        <label>NIL Value Suggestion ($)</label>
                        <div className="financial-amount">${evaluationResult.nilValueSuggestion.toLocaleString()}</div>
                        <p className="financial-note">NIL Readiness × Confidence × (NIL Pool ÷ Roster Size)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="kpg-line-section">
                  <h4>KPG™ Line</h4>
                  <p className="kpg-line">{evaluationResult.kpgLine}</p>
                  <p className="kpg-note">Pace-adjusted KaNeXT Per Game line, calibrated to division baseline</p>
                </div>

                {evaluationResult.overridesApplied && (
                  <div className="overrides-section">
                    <label>Overrides Applied</label>
                    <p>Manual KPI adjustments made by coach</p>
                  </div>
                )}
              </div>

              {/* Pro KPI Report (conditional view) */}
              {evaluationResult.showProKPI && (
                <div className="kpi-report-card pro-kpi">
                  <div className="kpi-report-header">
                    <h3>Pro KPI Report</h3>
                    <span className="pro-badge">Pro</span>
                  </div>

                  <div className="kpi-main-display">
                    <div className="kpi-score-large">{evaluationResult.proKPI}</div>
                    <div className="kpi-label-large">Final KPI (Pro)</div>
                    <p className="kpi-description">College KPI + professional-level adjustment curve</p>
                  </div>

                  <div className="kpi-details-grid">
                    <div className="kpi-detail-item">
                      <label>Role Projection</label>
                      <div className="kpi-detail-value">{evaluationResult.proRoleProjection}</div>
                    </div>

                    <div className="kpi-detail-item">
                      <label>Pro Tier Placement</label>
                      <div className="kpi-detail-value">{evaluationResult.proTierPlacement}</div>
                      <p className="kpi-detail-note">Market grid tier (T1A–T4C)</p>
                    </div>

                    <div className="kpi-detail-item">
                      <label>Market Value Projection ($)</label>
                      <div className="kpi-detail-value">${evaluationResult.marketValueProjection?.toLocaleString()}</div>
                      <p className="kpi-detail-note">Derived from pro comps and international agent data</p>
                    </div>

                    <div className="kpi-detail-item">
                      <label>Market Notes</label>
                      <div className="kpi-detail-value">{evaluationResult.marketNotes}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Module 3: Decision & Sync Panel */}
            <div className="decision-sync-module">
              <h2>Decision & Sync</h2>
              <div className="decision-panel-card">
                <div className="decision-header">
                  <h3>Next Step: Decision & Sync</h3>
                  <p className="decision-instructions">Select where to send this evaluation.</p>
                </div>

                {evaluationResult.confidence < 60 ? (
                  <div className="status-banner disabled">
                    <span className="status-icon">⚠</span>
                    <span>Disabled — Confidence below 60%</span>
                  </div>
                ) : (
                  <div className="status-banner active">
                    <span className="status-icon">✅</span>
                    <span>Ready to Sync</span>
                  </div>
                )}

                <div className="financial-snapshot">
                  <h4>Financial Snapshot</h4>
                  <div className="snapshot-grid">
                    <div className="snapshot-item">
                      <label>Scholarship</label>
                      <div className="snapshot-value">${evaluationResult.scholarshipSuggestion.toLocaleString()}</div>
                    </div>
                    <div className="snapshot-item">
                      <label>NIL Value</label>
                      <div className="snapshot-value">${evaluationResult.nilValueSuggestion.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div className="decision-actions">
                  <button 
                    className="secondary-btn" 
                    onClick={handleReset}
                  >
                    New Evaluation
                  </button>
                  <button 
                    className={`primary-btn ${evaluationResult.confidence < 60 ? 'disabled' : ''}`}
                    onClick={handleSyncToRecruitingIQ}
                    disabled={evaluationResult.confidence < 60}
                  >
                    Add to Recruiting IQ™
                  </button>
                  <button 
                    className={`primary-btn ${evaluationResult.confidence < 60 ? 'disabled' : ''}`}
                    onClick={handleSyncToTeamIQ}
                    disabled={evaluationResult.confidence < 60}
                  >
                    Add to Team IQ™
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <CoachingIQDrawer 
        isOpen={showDrawer} 
        onClose={() => {
          setShowDrawer(false);
          // Track that user manually closed the drawer
          setHasManuallyClosedDrawer(true);
          localStorage.setItem('playerIQ_drawer_closed', 'true');
        }} 
      />

      {/* Coach K™ Assistant */}
      <CoachKAssistant />
    </div>
  );
};

export default PlayerIQPage;

