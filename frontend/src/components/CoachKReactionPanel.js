import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import './CoachKReactionPanel.css';

const CoachKReactionPanel = ({ teamMetrics, sandboxMetrics, depthChartState, coachingBias, coachProfile }) => {
  const { teamState } = useApp();
  const [insightFeed, setInsightFeed] = useState([]);
  const [pinnedSimulation, setPinnedSimulation] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const prevMetricsRef = useRef(null);
  const prevRosterRef = useRef(null);

  // Generate insight message based on trigger and context
  const generateInsight = (trigger, context) => {
    const currentMetrics = sandboxMetrics || teamMetrics;
    const prevMetrics = prevMetricsRef.current || teamMetrics;
    
    const deltaKPI = currentMetrics.teamKPI - prevMetrics.teamKPI;
    const deltaFit = currentMetrics.systemFit - prevMetrics.systemFit;

    let message = '';
    let icon = '🧠';
    let type = 'info';
    let highlight = null;

    switch (trigger) {
      case 'roster_add':
        message = `Added ${context.playerName} (OVR ${context.kpi}) → Team KPI ${deltaKPI >= 0 ? '+' : ''}${deltaKPI.toFixed(1)} · Fit ${currentMetrics.systemFit}%`;
        icon = '📈';
        type = deltaKPI >= 0 ? 'positive' : 'negative';
        break;

      case 'roster_remove':
        message = `Removed ${context.playerName} → Team KPI ${deltaKPI >= 0 ? '+' : ''}${deltaKPI.toFixed(1)} · Fit ${currentMetrics.systemFit}%`;
        icon = '📉';
        type = deltaKPI < 0 ? 'positive' : 'negative';
        break;

      case 'depth_swap':
        message = `Lineup shift detected: ${context.fromPosition} → ${context.toPosition} · ${context.clusterChange ? `${context.clusterChange} cluster ${context.clusterDelta >= 0 ? '+' : ''}${context.clusterDelta}%` : 'Positional balance updated'}`;
        icon = '⚙️';
        type = 'info';
        break;

      case 'bias_apply':
        message = `${context.biasType} bias ${context.biasDelta >= 0 ? '+' : ''}${context.biasDelta}% → Team KPI ${deltaKPI >= 0 ? '+' : ''}${deltaKPI.toFixed(1)} · ${context.defGrade ? `def grade ${context.defGrade}` : 'system alignment updated'}`;
        icon = '⚙️';
        type = deltaKPI >= 0 ? 'positive' : 'negative';
        break;

      case 'financial_edit':
        message = `Financial adjustment → ${context.field} updated. ${context.nearCap ? 'Near scholarship cap — reallocating affects summary.' : 'Budget recalculated.'}`;
        icon = '💰';
        type = 'info';
        break;

      case 'predixt_run':
        message = `PrediXt™ simulation initiated — using ${context.sandbox ? 'sandbox' : 'official'} lineup (${context.playerCount} verified players).`;
        icon = '⚙️';
        type = 'simulation';
        break;

      case 'scenario_projection':
        message = `Season projection finished — ${deltaKPI >= 0 ? '+' : ''}${deltaKPI.toFixed(1)} KPI gain vs baseline.`;
        icon = '📊';
        type = 'simulation';
        highlight = {
          winProb: context.winProb,
          opponent: context.opponent,
          deltaKPI: deltaKPI.toFixed(1)
        };
        break;

      case 'roster_apply':
        message = `Roster locked · League Projection refresh queued for tonight.`;
        icon = '💾';
        type = 'success';
        break;

      case 'depth_analysis':
        const guardWeight = calculateGuardWeight(depthChartState);
        const offenseSystem = coachingBias?.offensiveSystem || 'Not Set';
        message = `${offenseSystem} offense ${guardWeight}% guard-weighted — ${guardWeight > 70 ? 'rim protection below target.' : 'positional balance optimal.'}`;
        icon = '📊';
        type = guardWeight > 70 ? 'warning' : 'info';
        highlight = { guardWeight, needsRimProtection: guardWeight > 70 };
        break;

      case 'strategic_insight':
        const tier = getTierFromKPI(currentMetrics.teamKPI);
        const division = coachProfile?.division || 'USCAA';
        message = `Current projection ${currentMetrics.teamKPI.toFixed(0)} KPI → ${division} ${tier}. ${context.recommendation || 'Add one Defensive Anchor to reach Top 25.'}`;
        icon = '🎯';
        type = 'strategic';
        highlight = { tier, division, recommendation: context.recommendation };
        break;

      default:
        message = context.message || 'Roster updated.';
        break;
    }

    return {
      id: `insight_${Date.now()}_${Math.random()}`,
      trigger,
      message,
      icon,
      type,
      deltaKPI: deltaKPI.toFixed(1),
      deltaFit: deltaFit >= 0 ? `+${deltaFit}` : `${deltaFit}`,
      highlight,
      timestamp: Date.now()
    };
  };

  const calculateGuardWeight = (lineupState) => {
    const pgPlayers = lineupState.PG || [];
    const cgPlayers = lineupState.CG || [];
    const allPlayers = Object.values(lineupState).flat();
    
    if (allPlayers.length === 0) return 0;
    
    const guardCount = pgPlayers.length + cgPlayers.length;
    return Math.round((guardCount / allPlayers.length) * 100);
  };

  const getTierFromKPI = (kpi) => {
    if (kpi >= 85) return 'Elite';
    if (kpi >= 80) return 'Contender';
    if (kpi >= 75) return 'Competitive';
    if (kpi >= 70) return 'Building';
    return 'Rebuilding';
  };

  // Monitor roster changes
  useEffect(() => {
    if (prevRosterRef.current && teamState.roster) {
      const prevRoster = prevRosterRef.current;
      const currentRoster = teamState.roster;

      // Check for additions
      const added = currentRoster.filter(p => !prevRoster.find(prev => prev.id === p.id));
      if (added.length > 0) {
        const player = added[0];
        const insight = generateInsight('roster_add', {
          playerName: player.name,
          kpi: player.final_kpi || player.kpi || 0
        });
        addInsight(insight);
      }

      // Check for removals
      const removed = prevRoster.filter(p => !currentRoster.find(curr => curr.id === p.id));
      if (removed.length > 0) {
        const player = removed[0];
        const insight = generateInsight('roster_remove', {
          playerName: player.name
        });
        addInsight(insight);
      }
    }

    prevRosterRef.current = teamState.roster ? [...teamState.roster] : [];
  }, [teamState.roster]);

  // Monitor metrics changes
  useEffect(() => {
    if (prevMetricsRef.current) {
      const currentMetrics = sandboxMetrics || teamMetrics;
      const prevMetrics = prevMetricsRef.current;

      const deltaKPI = Math.abs(currentMetrics.teamKPI - prevMetrics.teamKPI);
      const deltaFit = Math.abs(currentMetrics.systemFit - prevMetrics.systemFit);

      // Only generate insight if significant change
      if (deltaKPI > 0.5 || deltaFit > 2) {
        // This will be handled by specific triggers (roster_add, depth_swap, etc.)
      }
    }

    prevMetricsRef.current = sandboxMetrics || teamMetrics;
  }, [teamMetrics, sandboxMetrics]);

  // Listen for depth chart swaps
  useEffect(() => {
    if (Object.keys(depthChartState).length > 0) {
      const guardWeight = calculateGuardWeight(depthChartState);
      const insight = generateInsight('depth_analysis', {});
      addInsight(insight);
    }
  }, [depthChartState]);

  // Listen for custom events
  useEffect(() => {
    const handleRosterChange = (e) => {
      const insight = generateInsight(e.detail.trigger, e.detail.context);
      addInsight(insight);
    };

    const handleDepthSwap = (e) => {
      const insight = generateInsight('depth_swap', e.detail);
      addInsight(insight);
    };

    const handleBiasApply = (e) => {
      const insight = generateInsight('bias_apply', e.detail);
      addInsight(insight);
    };

    const handleFinancialEdit = (e) => {
      const insight = generateInsight('financial_edit', e.detail);
      addInsight(insight);
    };

    const handlePrediXtRun = (e) => {
      const insight = generateInsight('predixt_run', e.detail);
      if (e.detail.simulationType === 'scenario') {
        setPinnedSimulation(insight);
        setTimeout(() => setPinnedSimulation(null), 15000);
      } else {
        addInsight(insight);
      }
    };

    const handleRosterApply = () => {
      const insight = generateInsight('roster_apply', {});
      addInsight(insight);
    };

    window.addEventListener('teamRosterChange', handleRosterChange);
    window.addEventListener('teamDepthSwap', handleDepthSwap);
    window.addEventListener('teamBiasApply', handleBiasApply);
    window.addEventListener('teamFinancialEdit', handleFinancialEdit);
    window.addEventListener('teamPrediXtRun', handlePrediXtRun);
    window.addEventListener('teamRosterApply', handleRosterApply);

    return () => {
      window.removeEventListener('teamRosterChange', handleRosterChange);
      window.removeEventListener('teamDepthSwap', handleDepthSwap);
      window.removeEventListener('teamBiasApply', handleBiasApply);
      window.removeEventListener('teamFinancialEdit', handleFinancialEdit);
      window.removeEventListener('teamPrediXtRun', handlePrediXtRun);
      window.removeEventListener('teamRosterApply', handleRosterApply);
    };
  }, []);

  const addInsight = (insight) => {
    setInsightFeed(prev => {
      const newFeed = [insight, ...prev].slice(0, 3); // Max 3 messages
      return newFeed;
    });
  };

  const getDeltaColor = (delta) => {
    const num = parseFloat(delta);
    if (num > 0) return '#D4AF37'; // Gold
    if (num < 0) return '#FF4D4D'; // Red
    return '#FFFFFF'; // White
  };

  const getDeltaIcon = (delta) => {
    const num = parseFloat(delta);
    if (num > 0) return '↑';
    if (num < 0) return '↓';
    return '→';
  };

  if (isCollapsed) {
    return (
      <div className="coach-k-reaction-panel collapsed" onClick={() => setIsCollapsed(false)}>
        <div className="collapse-indicator">
          <span className="icon">🧠</span>
          {insightFeed.length > 0 && <span className="badge">{insightFeed.length}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={`coach-k-reaction-panel ${isPinned ? 'pinned' : ''}`}>
      <div className="panel-header">
        <div className="header-title">
          <span className="icon">🧠</span>
          <span>Coach K™ Reactions</span>
        </div>
        <div className="header-actions">
          <button 
            className="action-btn" 
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            📌
          </button>
          <button 
            className="action-btn" 
            onClick={() => setIsCollapsed(true)}
            title="Collapse"
          >
            −
          </button>
        </div>
      </div>

      <div className="panel-content">
        {/* Pinned Simulation Card */}
        {pinnedSimulation && (
          <div className="insight-card simulation pinned">
            <div className="card-header">
              <span className="card-icon">{pinnedSimulation.icon}</span>
              <span className="card-type">Simulation</span>
            </div>
            <div className="card-message">{pinnedSimulation.message}</div>
            {pinnedSimulation.highlight && (
              <div className="card-highlight">
                {pinnedSimulation.highlight.winProb && (
                  <div className="highlight-item">
                    Win Prob: <span className="value">{pinnedSimulation.highlight.winProb}%</span>
                  </div>
                )}
                {pinnedSimulation.highlight.opponent && (
                  <div className="highlight-item">
                    vs <span className="value">{pinnedSimulation.highlight.opponent}</span>
                  </div>
                )}
                {pinnedSimulation.highlight.deltaKPI && (
                  <div className="highlight-item">
                    KPI Δ: <span className="value" style={{ color: getDeltaColor(pinnedSimulation.highlight.deltaKPI) }}>
                      {getDeltaIcon(pinnedSimulation.highlight.deltaKPI)} {pinnedSimulation.highlight.deltaKPI}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Insight Feed */}
        <div className="insight-feed">
          {insightFeed.length === 0 ? (
            <div className="empty-state">
              <p>Coach K™ will react to roster changes, lineup tests, and simulations here.</p>
            </div>
          ) : (
            insightFeed.map(insight => (
              <div key={insight.id} className={`insight-card ${insight.type}`}>
                <div className="card-header">
                  <span className="card-icon">{insight.icon}</span>
                  <span className="card-type">{insight.trigger}</span>
                </div>
                <div className="card-message">{insight.message}</div>
                {(insight.deltaKPI !== '0.0' || insight.deltaFit !== '0') && (
                  <div className="card-deltas">
                    {insight.deltaKPI !== '0.0' && (
                      <span className="delta" style={{ color: getDeltaColor(insight.deltaKPI) }}>
                        KPI {getDeltaIcon(insight.deltaKPI)} {insight.deltaKPI}
                      </span>
                    )}
                    {insight.deltaFit !== '0' && (
                      <span className="delta" style={{ color: getDeltaColor(insight.deltaFit) }}>
                        Fit {getDeltaIcon(insight.deltaFit)} {insight.deltaFit}%
                      </span>
                    )}
                  </div>
                )}
                {insight.highlight && (
                  <div className="card-highlight">
                    {insight.highlight.guardWeight && (
                      <div className="highlight-item">
                        Guard Weight: <span className="value">{insight.highlight.guardWeight}%</span>
                      </div>
                    )}
                    {insight.highlight.recommendation && (
                      <div className="highlight-item">
                        <span className="value">{insight.highlight.recommendation}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachKReactionPanel;



