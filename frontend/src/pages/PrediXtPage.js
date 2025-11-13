import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { isAuthenticated } from '../services/authService';
import './PrediXtPage.css';

const PrediXtPage = () => {
  const navigate = useNavigate();
  const { coachProfile, coachingBias, teamState } = useApp();
  
  const [simulationMode, setSimulationMode] = useState('single'); // single or season
  const [opponent, setOpponent] = useState('');
  const [opponentProfile, setOpponentProfile] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConferenceSnapshot, setShowConferenceSnapshot] = useState(false);
  const [showConferenceStandings, setShowConferenceStandings] = useState(false);
  const [seasonIntelligence, setSeasonIntelligence] = useState(null);
  const [isIntelligenceCollapsed, setIsIntelligenceCollapsed] = useState(false);

  // Calculate Team KPI with system weights
  const teamKPI = useMemo(() => {
    if (!teamState.roster || teamState.roster.length === 0) return 0;
    
    const avgKPI = teamState.roster.reduce((sum, p) => sum + (p.final_kpi || p.kpi || 0), 0) / teamState.roster.length;
    const systemFit = teamState.systemFit || 0;
    
    // Weighted calculation: Off (52%) + Def (33%) + Core (15%)
    // Simplified: base KPI adjusted by system fit
    const weightedKPI = avgKPI * (0.52 + (systemFit / 100) * 0.33 + 0.15);
    return weightedKPI.toFixed(1);
  }, [teamState.roster, teamState.systemFit]);

  // Mock opponent database
  const opponentDatabase = [
    { name: 'Howard College', division: 'D1', system: 'Zone / Run-and-Gun', kpi: 78.9, record: '18-12', conference: 'SWAC' },
    { name: 'Odessa JC', division: 'JUCO', system: 'Physical Forwards', kpi: 80.2, record: '22-8', conference: 'WJCAC' },
    { name: 'Clarendon JC', division: 'JUCO', system: 'Tempo Edge', kpi: 77.5, record: '19-11', conference: 'WJCAC' },
    { name: 'Dallas CC', division: 'JUCO', system: 'Guard Creation', kpi: 81.0, record: '24-6', conference: 'NTJCAC' },
    { name: 'Midland JC', division: 'JUCO', system: 'Interior Control', kpi: 75.8, record: '16-14', conference: 'WJCAC' },
  ];

  const handleOpponentSelect = (opponentName) => {
    setOpponent(opponentName);
    const selected = opponentDatabase.find(o => o.name === opponentName);
    if (selected) {
      setOpponentProfile(selected);
    }
  };

  const handleRunSimulation = () => {
    if (simulationMode === 'single' && !opponent) {
      alert('Please select an opponent');
      return;
    }

    console.log('[LOGIC HOOK: handleRunSimulation] Running PrediXt:', {
      mode: simulationMode,
      opponent: opponent || 'N/A (Full Season)'
    });

    setLoading(true);

    setTimeout(() => {
      if (simulationMode === 'single') {
        const selectedOpponent = opponentDatabase.find(o => o.name === opponent);
        const opponentKPI = selectedOpponent?.kpi || (Math.random() * 15 + 70).toFixed(1);
        const opponentSystem = selectedOpponent?.system || 'Standard';
        const opponentDivision = selectedOpponent?.division || 'D2';
        
        const kpiDiff = parseFloat(teamKPI) - parseFloat(opponentKPI);
        const winProb = Math.min(95, Math.max(5, 50 + kpiDiff * 3));
        const ourScore = Math.round(75 + Math.random() * 15);
        const theirScore = Math.round(ourScore - (winProb - 50) / 5);
        const margin = ourScore - theirScore;
        const confidence = Math.min(90, Math.max(60, winProb + Math.random() * 10 - 5));

        // Generate player impact highlights
        const playerImpacts = [];
        if (teamState.roster && teamState.roster.length > 0) {
          const topPlayers = teamState.roster
            .filter(p => p.archetype || p.position)
            .slice(0, 4)
            .map(player => {
              const archetype = player.archetype || 'Player';
              const position = player.position || '';
              let impact = '';
              let delta = (Math.random() * 2 + 0.5).toFixed(1);
              
              if (archetype.includes('Sniper') || archetype.includes('3&D')) {
                impact = `+${delta} made 3s vs ${opponentSystem.includes('Zone') ? 'Zone' : 'Man'} Defense`;
              } else if (archetype.includes('Slasher') || position === 'PG') {
                impact = `+${(parseFloat(delta) + 1).toFixed(1)} pts from rim attacks`;
              } else if (archetype.includes('Def') || archetype.includes('Anchor')) {
                impact = `+${delta} reb · -${(Math.random() * 0.5).toFixed(1)} fouls`;
              } else {
                impact = `+${delta} made 3s if ≥ 15 min`;
              }
              
              return {
                player: player.name || player.firstName || `${position} Player`,
                archetype: archetype,
                impact: impact,
                icon: archetype.includes('Sniper') || archetype.includes('3&D') ? '🎯' : 
                      archetype.includes('Slasher') ? '⚡' : 
                      archetype.includes('Def') || archetype.includes('Anchor') ? '🧱' : '🎯'
              };
            });
          playerImpacts.push(...topPlayers);
        }

        // Generate Coach K narrative
        const narratives = [
          `Your ${coachingBias?.offensiveSystem || 'Five-Out'} spacing creates +${Math.round(Math.random() * 5 + 5)} offensive possessions. Expect tempo neutral and edge on glass. Likely decided in final 2 minutes — momentum slightly positive.`,
          `System mismatch favors your ${coachingBias?.offensiveSystem || 'offense'} against ${opponentSystem}. Projected +${Math.round(Math.random() * 3 + 2)} fast-break points from tempo advantage.`,
          `Close matchup expected. Your defensive system (${coachingBias?.defensiveSystem || 'Pack Line'}) should limit ${opponentSystem.includes('Run') ? 'transition' : 'half-court'} opportunities.`
        ];

        // Clear season intelligence for single-game mode
        setSeasonIntelligence(null);

        setSimulationResult({
          mode: 'single',
          opponent: opponent,
          opponentProfile: selectedOpponent || { name: opponent, division: opponentDivision, system: opponentSystem, kpi: opponentKPI },
          opponentKPI: opponentKPI,
          predictedScore: `${ourScore}–${theirScore}`,
          predictedScoreFull: `${ourScore} - ${theirScore}`,
          margin: margin > 0 ? `+${margin}` : `${margin}`,
          winProbability: Math.round(winProb),
          confidence: Math.round(confidence),
          teamKPI: teamKPI,
          playerImpacts: playerImpacts,
          coachKNarrative: narratives[Math.floor(Math.random() * narratives.length)],
          totalScore: ourScore + theirScore
        });
      } else {
        // Full Season simulation
        const wins = Math.round(15 + Math.random() * 10);
        const losses = 30 - wins;
        const conferenceRank = Math.ceil(Math.random() * 12);
        const avgConfidence = Math.round(70 + Math.random() * 15);
        const autoBidLikelihood = Math.round(30 + Math.random() * 20);

        // Generate game results grid
        const gameResults = opponentDatabase.map((opp, idx) => {
          const date = new Date(2024, 10, 12 + idx * 4); // Nov 12, 16, 20, etc.
          const kpiDiff = parseFloat(teamKPI) - opp.kpi;
          const winProb = Math.min(95, Math.max(5, 50 + kpiDiff * 3));
          const ourScore = Math.round(75 + Math.random() * 15);
          const theirScore = Math.round(ourScore - (winProb - 50) / 5);
          const won = ourScore > theirScore;
          const confidence = Math.round(winProb + Math.random() * 10 - 5);
          
          // Archetype note
          let archetypeNote = '';
          if (opp.system.includes('Zone')) {
            archetypeNote = 'Zone D → Snipers +1.2 3PM';
          } else if (opp.system.includes('Physical')) {
            archetypeNote = 'Physical Forwards → rim pressure loss';
          } else if (opp.system.includes('Tempo')) {
            archetypeNote = 'Tempo edge → +15 fast-break pts';
          } else if (opp.system.includes('Guard')) {
            archetypeNote = 'Guard creation −2 AST';
          } else if (opp.system.includes('Interior')) {
            archetypeNote = 'Interior control +7 REB';
          }

          return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            opponent: opp.name,
            opponentKPI: opp.kpi,
            predictedScore: `${ourScore}–${theirScore} ${won ? '(W)' : '(L)'}`,
            confidence: confidence,
            archetypeNote: archetypeNote
          };
        });

        // Coach K Season Analysis
        const seasonAnalysis = `Sandbox roster outpaces baseline +${Math.round(Math.random() * 5 + 5)} possessions per game from improved backcourt creation.
Added Sniper archetype boosts 3P efficiency (+${Math.round(Math.random() * 3 + 2)}%), shifting projected record +${Math.round(Math.random() * 2 + 1)} wins.
Defensive rebounding drops −${Math.round(Math.random() * 3 + 4)}% due to undersized rotation; tempo variance adds minor instability in low-confidence games.
Recommendation: rebalance rotation to add Def Anchor ≥ 80 KPI or bias +3 Defense to restore stability.`;

        // Generate Season Intelligence
        const homeWinProb = Math.round(75 + Math.random() * 10);
        const roadWinProb = Math.round(homeWinProb - 12);
        const tempoDrop = Math.round(Math.random() * 3 + 4);
        const sniperNetKPG = (Math.random() * 2 + 2).toFixed(1);
        const slasherUnderperform = (Math.random() * 1.5 + 1.5).toFixed(1);
        const defRebDrop = (Math.round(Math.random() * 2 + 4)).toFixed(1);
        const physicalLosses = Math.round((losses * 0.71) || 0);

        const intelligence = {
          performanceSignals: [
            {
              type: 'trend',
              icon: '📈',
              message: `Road games win prob −${homeWinProb - roadWinProb} pp vs home.`,
              color: 'negative'
            },
            {
              type: 'risk',
              icon: '⚠',
              message: `Tempo drops after Game 20 → +${tempoDrop} pp loss prob late season.`,
              color: 'negative'
            }
          ],
          archetypeImpact: [
            {
              type: 'positive',
              icon: '🎯',
              message: `Snipers (+${sniperNetKPG} Net KPG) carry offense;`,
              color: 'positive'
            },
            {
              type: 'negative',
              icon: '⚡',
              message: `Slashers underperform vs Zone (−${slasherUnderperform} pts).`,
              color: 'negative'
            }
          ],
          strategicRecommendation: `Shift bias +${Math.round(Math.random() * 2 + 2)} Defense and add Rim Anchor ≥ 80 KPI to convert ${Math.round(Math.random() * 2 + 1)} projected losses to wins.`,
          keyDeltas: {
            tempo: `+${(Math.random() * 2 + 3).toFixed(1)}`,
            def_reb: `-${defRebDrop}`,
            efficiency_off: `+${(Math.random() * 2 + 2).toFixed(1)}`
          },
          physicalLosses: physicalLosses,
          totalGames: gameResults.length
        };

        setSeasonIntelligence(intelligence);
        setSimulationResult({
          mode: 'season',
          projectedRecord: `${wins}–${losses}`,
          projectedRecordFull: `${wins} - ${losses}`,
          conferenceRank: conferenceRank,
          totalTeams: 12,
          avgConfidence: avgConfidence,
          autoBidLikelihood: autoBidLikelihood,
          teamKPI: teamKPI,
          gameResults: gameResults,
          coachKAnalysis: seasonAnalysis
        });
      }

      setLoading(false);
    }, 2000);
  };

  useEffect(() => {
    if (!isAuthenticated() || !coachProfile) {
      navigate('/login');
    }
  }, [navigate, coachProfile]);

  if (!isAuthenticated() || !coachProfile) {
    return null;
  }

  // Calculate conference average KPI (mock)
  const conferenceAvgKPI = 78.5;
  const kpiVsConference = (parseFloat(teamKPI) - conferenceAvgKPI).toFixed(1);

  return (
    <div className="predixt-page">
      {/* Section 1 - Header / Context Bar */}
      <header className="predixt-header">
        {/* Main Bar - 80px */}
        <div className="header-main-bar">
          {/* Left Zone - Module Identity + Team Context */}
          <div className="header-left-zone">
            <h1>PREDIXT™ ENGINE</h1>
            <p className="subtitle">Game + Season Forecast Engine · linked to Team IQ™ state.</p>
            <div className="context-line">
              <span 
                className="context-link" 
                onClick={() => navigate('/team-iq')}
                title="View Team IQ™ Roster"
              >
                Team: {coachProfile.team}
              </span>
              {' · '}
              <span>Division: {coachProfile.division || 'D2'}</span>
              {' · '}
              <span>System: {coachingBias?.offensiveSystem || 'Not Set'} / {coachingBias?.defensiveSystem || 'Not Set'}</span>
            </div>
            <div className="team-kpi-display">
              <span className="kpi-label">Team KPI:</span>
              <span 
                className="kpi-value"
                onClick={() => setShowConferenceStandings(!showConferenceStandings)}
                title="Calculated from Off / Def / Core clusters weighted 52 / 33 / 15"
              >
                {teamKPI}
              </span>
              <button 
                className="kpi-icon-btn"
                onClick={() => setShowConferenceStandings(!showConferenceStandings)}
                title="View Conference Standings"
              >
                📊
              </button>
            </div>
          </div>

          {/* Center Zone - Simulation Controls */}
          <div className="header-center-zone">
            <div className="simulation-controls-inline">
              <div className="opponent-selector-inline">
          <label>Select Opponent</label>
          <select
            value={opponent}
                  onChange={(e) => handleOpponentSelect(e.target.value)}
          >
            <option value="">Select Opponent</option>
                  {opponentDatabase.map(opp => (
                    <option key={opp.name} value={opp.name}>
                      {opp.name} ({opp.record}) · KPI {opp.kpi}
                    </option>
                  ))}
          </select>
        </div>
              <div className="mode-toggle-inline">
          <button 
            className={simulationMode === 'single' ? 'active' : ''}
            onClick={() => {
              setSimulationMode('single');
              console.log('[LOGIC HOOK: handleSimulationModeChange] Mode changed to: Single Game');
            }}
          >
            Single Game
          </button>
          <button 
            className={simulationMode === 'season' ? 'active' : ''}
            onClick={() => {
              setSimulationMode('season');
              console.log('[LOGIC HOOK: handleSimulationModeChange] Mode changed to: Full Season');
            }}
          >
            Full Season
          </button>
        </div>
        <button 
                className="run-btn-inline"
          onClick={handleRunSimulation}
          disabled={loading}
        >
          {loading ? '▶ Running...' : '▶ Run PrediXt'}
        </button>
      </div>
          </div>

          {/* Right Zone - Division + Conference Snapshot */}
          <div className="header-right-zone">
            <button 
              className={`conference-snapshot-btn ${showConferenceSnapshot ? 'active' : ''}`}
              onClick={() => setShowConferenceSnapshot(!showConferenceSnapshot)}
              title="Division + Conference Snapshot"
            >
              📊
            </button>
            <button className="nav-btn" onClick={() => navigate('/team-iq')}>
              Team IQ™
            </button>
            <button className="nav-btn" onClick={() => navigate('/office')}>
              🏠
            </button>
          </div>
        </div>

        {/* Summary Line - 40px */}
        <div className="header-summary-line">
          <div className="summary-item">
            <span className="label">Record:</span>
            <span className="value">
              {simulationResult?.mode === 'season' ? simulationResult.projectedRecordFull : '0-0'}
            </span>
          </div>
          <div className="summary-item">
            <span className="label">Conference Rank:</span>
            <span 
              className="value clickable"
              onClick={() => setShowConferenceStandings(!showConferenceStandings)}
            >
              {simulationResult?.mode === 'season' ? `#${simulationResult.conferenceRank} / ${simulationResult.totalTeams}` : '—'}
            </span>
          </div>
          <div className="summary-item">
            <span className="label">KPI vs Conference Avg:</span>
            <span className={`value ${parseFloat(kpiVsConference) >= 0 ? 'positive' : 'negative'}`}>
              {parseFloat(kpiVsConference) >= 0 ? '+' : ''}{kpiVsConference}
            </span>
          </div>
        </div>
      </header>

      {/* Conference Standings Panel */}
      {showConferenceStandings && (
        <div className="conference-standings-panel">
          <div className="standings-header">
            <h3>Conference Standings</h3>
            <button onClick={() => setShowConferenceStandings(false)}>×</button>
          </div>
          <div className="standings-content">
            <p>Conference standings will be displayed here</p>
          </div>
        </div>
      )}

      {/* Section 2 - Simulation Output View */}
      <div className={`predixt-content ${seasonIntelligence && simulationResult?.mode === 'season' ? (isIntelligenceCollapsed ? 'with-intelligence-collapsed' : '') : 'without-intelligence'}`}>
        {!simulationResult ? (
          <div className="placeholder-structure">
            <div className="placeholder-section">
              <h3>Team Context & Scoreline</h3>
              <p className="placeholder-text">Simulation results will appear here</p>
            </div>
            <div className="placeholder-section">
              <h3>Player Impact Highlights</h3>
              <p className="placeholder-text">Key player contributions will be displayed here</p>
            </div>
          </div>
        ) : (
          <div className="simulation-results">
          {simulationResult.mode === 'single' ? (
              /* Single-Game View */
              <div className="single-game-view">
                {/* 1. Team Context & Scoreline */}
                <div className="team-context-scoreline">
                  <div className="matchup-header">
                    <div className="team-info">
                      <h2>{coachProfile.team}</h2>
                      <div className="team-details">
                        <span>{coachProfile.division || 'D2'} · {coachingBias?.offensiveSystem || 'Five-Out'} / {coachingBias?.defensiveSystem || 'Pack Line'}</span>
                      </div>
                      <div className="team-kpi-display-inline">
                        <span className="kpi-label">Team KPI:</span>
                        <span className="kpi-value">{simulationResult.teamKPI}</span>
                      </div>
                    </div>
                    <div className="vs-divider">🆚</div>
                    <div className="team-info">
                      <h2>{simulationResult.opponent}</h2>
                      <div className="team-details">
                        <span>{simulationResult.opponentProfile?.division || 'D2'} · {simulationResult.opponentProfile?.system || 'Standard'}</span>
                      </div>
                      <div className="team-kpi-display-inline">
                        <span className="kpi-label">Team KPI:</span>
                        <span className="kpi-value">{simulationResult.opponentKPI}</span>
                </div>
                </div>
              </div>

                  <div className="scoreline-prediction">
                    <div className="predicted-score-large">
                      {simulationResult.predictedScore}
                    </div>
                    <div className="score-margin">
                      {coachProfile.team} Win {simulationResult.margin}
                    </div>
                    <div className="confidence-display">
                      <span className="confidence-label">Confidence %:</span>
                      <span className="confidence-value">{simulationResult.confidence}%</span>
                      <span className="confidence-note">Probability within one-possession margin</span>
                    </div>
                    {simulationResult.totalScore && (
                      <div className="total-score-muted">
                        Total: {simulationResult.totalScore} pts
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Player Impact Highlights */}
                {simulationResult.playerImpacts && simulationResult.playerImpacts.length > 0 && (
                  <div className="player-impact-highlights">
                    <h3>Player Impact Highlights</h3>
                    <div className="impact-list">
                      {simulationResult.playerImpacts.map((impact, idx) => (
                        <div key={idx} className="impact-item">
                          <span className="impact-icon">{impact.icon}</span>
                          <div className="impact-details">
                            <span className="impact-player">{impact.player} ({impact.archetype})</span>
                            <span className="impact-text">→ {impact.impact}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Coach K™ Narrative */}
                <div className="coach-k-narrative">
                  <h3>Coach K™ Narrative</h3>
                  <p>{simulationResult.coachKNarrative}</p>
                </div>
              </div>
            ) : (
              /* Full-Season View */
              <div className="full-season-view">
                {/* 1. Season Summary Bar + Coach K™ Analysis */}
                <div className="season-summary-bar">
                  <div className="summary-comparison">
                    <div className="comparison-row">
                      <div className="comparison-label">Projected Record</div>
                      <div className="comparison-values">
                        <span className="current-value">{simulationResult.projectedRecordFull}</span>
                        <span className="sandbox-value">{simulationResult.projectedRecordFull}</span>
                        <span className="delta-value">+0</span>
                      </div>
                    </div>
                    <div className="comparison-row">
                      <div className="comparison-label">Avg Confidence</div>
                      <div className="comparison-values">
                        <span className="current-value">{simulationResult.avgConfidence}%</span>
                        <span className="sandbox-value">{simulationResult.avgConfidence}%</span>
                        <span className="delta-value">0 pp</span>
                      </div>
                    </div>
                    <div className="comparison-row">
                      <div className="comparison-label">Conference Rank</div>
                      <div className="comparison-values">
                        <span className="current-value">{simulationResult.conferenceRank} / {simulationResult.totalTeams}</span>
                        <span className="sandbox-value">{simulationResult.conferenceRank} / {simulationResult.totalTeams}</span>
                        <span className="delta-value">0</span>
                      </div>
                    </div>
                    <div className="comparison-row">
                      <div className="comparison-label">Auto-Bid Likelihood</div>
                      <div className="comparison-values">
                        <span className="current-value">{simulationResult.autoBidLikelihood}%</span>
                        <span className="sandbox-value">{simulationResult.autoBidLikelihood}%</span>
                        <span className="delta-value">0 pp</span>
                      </div>
                </div>
              </div>

                  <div className="coach-k-season-analysis">
                    <h3>Coach K™ Analytical Summary</h3>
                    <p>{simulationResult.coachKAnalysis}</p>
                  </div>
                </div>

                {/* 2. Game Results Grid */}
                {simulationResult.gameResults && (
                  <div className="game-results-grid-container">
                    <h3>Game Results Grid — Full Season Mode</h3>
                    <table className="game-results-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Opponent</th>
                          <th>Opponent KPI</th>
                          <th>Predicted Score</th>
                          <th>Confidence %</th>
                          <th>Archetype Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simulationResult.gameResults.map((game, idx) => (
                          <tr key={idx} className={game.predictedScore.includes('(W)') ? 'win-row' : 'loss-row'}>
                            <td>{game.date}</td>
                            <td className="opponent-name">{game.opponent}</td>
                            <td>{game.opponentKPI}</td>
                            <td className="score-cell">{game.predictedScore}</td>
                            <td>{game.confidence}%</td>
                            <td className="archetype-note">{game.archetypeNote}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 3 - Coach K™ Season Intelligence Layer */}
      {seasonIntelligence && simulationResult?.mode === 'season' && (
        <div className={`coach-k-season-intelligence ${isIntelligenceCollapsed ? 'collapsed' : ''}`}>
          <div className="intelligence-header">
            <div className="intelligence-title">
              <span className="intelligence-icon">🧠</span>
              {!isIntelligenceCollapsed && <span>Coach K™ Season Intelligence</span>}
            </div>
            <div className="intelligence-actions">
              <button 
                className="intelligence-action-btn"
                onClick={() => setIsIntelligenceCollapsed(!isIntelligenceCollapsed)}
                title={isIntelligenceCollapsed ? "Expand" : "Collapse"}
              >
                {isIntelligenceCollapsed ? '→' : '←'}
              </button>
            </div>
          </div>

          {!isIntelligenceCollapsed && (
            <div className="intelligence-content">
              {/* Zone 1 - Season Performance Signals */}
              <div className="intelligence-zone">
                <h3 className="intelligence-zone-title">Season Performance Signals</h3>
                <div className="signals-list">
                  {seasonIntelligence.performanceSignals.map((signal, idx) => (
                    <div key={idx} className={`signal-item signal-${signal.color}`}>
                      <span className="signal-icon">{signal.icon}</span>
                      <span className="signal-message">{signal.message}</span>
                </div>
                  ))}
                  <div className="signal-meta" title={`Based on ${seasonIntelligence.totalGames} games simulated`}>
                    Based on {seasonIntelligence.totalGames} games simulated
                  </div>
                </div>
              </div>

              {/* Zone 2 - Archetype Impact Report */}
              <div className="intelligence-zone">
                <h3 className="intelligence-zone-title">Archetype Impact Report</h3>
                <div className="archetype-impact-list">
                  {seasonIntelligence.archetypeImpact.map((impact, idx) => (
                    <div key={idx} className={`impact-report-item impact-${impact.color}`}>
                      <span className="impact-icon">{impact.icon}</span>
                      <span className="impact-message">{impact.message}</span>
                    </div>
                  ))}
                  <div className="impact-summary">
                    <span className="summary-label">Key Deltas:</span>
                    <div className="deltas-list">
                      <span>Tempo: <span className="delta-positive">{seasonIntelligence.keyDeltas.tempo}</span></span>
                      <span>Def Reb: <span className="delta-negative">{seasonIntelligence.keyDeltas.def_reb}%</span></span>
                      <span>Off Eff: <span className="delta-positive">{seasonIntelligence.keyDeltas.efficiency_off}%</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone 3 - Strategic Adjustment / Recommendation */}
              <div className="intelligence-zone">
                <h3 className="intelligence-zone-title">Strategic Adjustment / Recommendation</h3>
                <div className="recommendation-box">
                  <p className="recommendation-text">{seasonIntelligence.strategicRecommendation}</p>
                  {seasonIntelligence.physicalLosses > 0 && (
                    <p className="recommendation-note">
                      {seasonIntelligence.physicalLosses}% of losses occur vs physical frontcourts (Zone or Hi-Low systems).
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          </div>
        )}
    </div>
  );
};

export default PrediXtPage;

