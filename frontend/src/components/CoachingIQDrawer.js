import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import './CoachingIQDrawer.css';

const CoachingIQDrawer = ({ isOpen, onClose }) => {
  const { coachProfile, coachingBias, updateCoachingBias, addCoachKMessage } = useApp();
  
  const [formData, setFormData] = useState({
    programName: '',
    programLevel: '',
    division: '',
    seasonYear: '2024-25',
    offensiveSystem: '',
    defensiveSystem: '',
    positionWeights: {
      PG: 20,
      CG: 20,
      Wing: 20,
      Forward: 20,
      Big: 20
    },
    clusterWeights: {
      Creation: 20,
      Shooting: 20,
      Decision: 20,
      Defensive: 20,
      'Core / Motor': 20
    },
    scholarshipCap: 12,
    scholarshipSlots: {},
    nilPool: 50000
  });

  const [expandedTraits, setExpandedTraits] = useState({});

  useEffect(() => {
    if (coachProfile) {
      setFormData(prev => ({
        ...prev,
        programName: coachProfile.team || '',
        programLevel: coachProfile.division || '',
        offensiveSystem: coachProfile.offense || '',
        defensiveSystem: coachProfile.defense || ''
      }));
    }

    if (coachingBias) {
      setFormData(prev => ({ ...prev, ...coachingBias }));
    }
  }, [coachProfile, coachingBias]);

  const handleApply = () => {
    // Validate required fields
    if (!formData.programLevel) {
      addCoachKMessage({
        speaker: 'Coach K',
        message: 'Program Level is required. Please select a level before applying.',
        type: 'error'
      });
      return;
    }

    console.log('[LOGIC HOOK: handleApply] Applying Coaching IQ configuration:', formData);
    
    const prevBias = coachingBias || {};
    const biasDelta = formData.offensiveSystem !== prevBias.offensiveSystem ? 5 : 0;
    
    updateCoachingBias(formData);
    addCoachKMessage({
      speaker: 'Coach K',
      message: 'Program and financial context updated.',
      type: 'success'
    });

    // Dispatch bias apply event for Coach K™
    window.dispatchEvent(new CustomEvent('teamBiasApply', {
      detail: {
        biasType: formData.offensiveSystem !== prevBias.offensiveSystem ? 'Offensive' : 'System',
        biasDelta: biasDelta
      }
    }));
    
    onClose();
  };

  const handleCancel = () => {
    console.log('[LOGIC HOOK: handleCancel] Cancelling Coaching IQ configuration changes');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose}></div>
      <div className={`coaching-iq-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2>System Configuration</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="drawer-content">
          {/* Layer 1 - Program Context */}
          <section className="drawer-section">
            <h3>1. Program Context</h3>
            <div className="form-group">
              <label>Program Name *</label>
              <input
                type="text"
                value={formData.programName}
                onChange={(e) => setFormData({ ...formData, programName: e.target.value })}
                placeholder="Your Team/School"
              />
            </div>
            <div className="form-group">
              <label>Program Level *</label>
              <select
                value={formData.programLevel}
                onChange={(e) => {
                  const level = e.target.value;
                  setFormData({ 
                    ...formData, 
                    programLevel: level,
                    // Auto-load defaults based on program level
                    scholarshipCap: level === 'NCAA D1' ? 12 : level === 'NCAA D2' ? 8 : level === 'NCAA D3' ? 0 : 12
                  });
                }}
              >
                <option value="">Select Level</option>
                <option value="NCAA D1">NCAA D1</option>
                <option value="NCAA D2">NCAA D2</option>
                <option value="NCAA D3">NCAA D3</option>
                <option value="NAIA">NAIA</option>
                <option value="JUCO">JUCO</option>
                <option value="Pro">Pro</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div className="form-group">
              <label>Division / Conference (optional)</label>
              <input
                type="text"
                value={formData.division}
                onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                placeholder="e.g., Big Ten, ACC"
              />
            </div>
            <div className="form-group">
              <label>Season Year</label>
              <select
                value={formData.seasonYear}
                onChange={(e) => setFormData({ ...formData, seasonYear: e.target.value })}
              >
                <option value="2024-25">2024-25</option>
                <option value="2025-26">2025-26</option>
                <option value="2026-27">2026-27</option>
              </select>
            </div>
          </section>

          {/* Layer 2 - System Selection */}
          <section className="drawer-section">
            <h3>2. System Selection</h3>
            <div className="form-group">
              <label>Offensive System</label>
              <select
                value={formData.offensiveSystem}
                onChange={(e) => {
                  setFormData({ ...formData, offensiveSystem: e.target.value });
                  addCoachKMessage({
                    speaker: 'Coach K',
                    message: `System context updated to ${e.target.value}.`,
                    type: 'info'
                  });
                }}
              >
                <option value="">Select System</option>
                <option value="Five-Out">Five-Out</option>
                <option value="Motion">Motion</option>
                <option value="Pace & Space">Pace & Space</option>
                <option value="Post-Centric">Post-Centric</option>
                <option value="Moreyball">Moreyball</option>
              </select>
            </div>
            <div className="form-group">
              <label>Defensive System</label>
              <select
                value={formData.defensiveSystem}
                onChange={(e) => {
                  setFormData({ ...formData, defensiveSystem: e.target.value });
                  addCoachKMessage({
                    speaker: 'Coach K',
                    message: `System context updated to ${e.target.value}.`,
                    type: 'info'
                  });
                }}
              >
                <option value="">Select System</option>
                <option value="Pack Line">Pack Line</option>
                <option value="Havoc">Havoc</option>
                <option value="Switch">Switch</option>
                <option value="Zone">Zone</option>
                <option value="No-Middle">No-Middle</option>
              </select>
            </div>
          </section>

          {/* Layer 3 - Positional & Trait Weighting */}
          <section className="drawer-section">
            <h3>3. Positional & Trait Weighting</h3>
            
            {/* Positional Importance */}
            <div className="subsection">
              <h4>Positional Importance</h4>
              <p className="section-note">Adjust sliders to total 100%</p>
              {Object.keys(formData.positionWeights).map(position => (
                <div key={position} className="slider-group">
                  <label>{position}: {formData.positionWeights[position]}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.positionWeights[position]}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      const total = Object.values(formData.positionWeights).reduce((a, b) => a + b, 0) - formData.positionWeights[position] + newValue;
                      if (total <= 100) {
                        setFormData({
                          ...formData,
                          positionWeights: {
                            ...formData.positionWeights,
                            [position]: newValue
                          }
                        });
                      }
                    }}
                  />
                </div>
              ))}
              <div className="weight-total">
                Total: {Object.values(formData.positionWeights).reduce((a, b) => a + b, 0)}%
              </div>
            </div>

            {/* Cluster Weighting */}
            <div className="subsection">
              <h4>Cluster Weighting</h4>
              <p className="section-note">Five clusters — Creation, Shooting, Decision, Defensive, Core / Motor</p>
              {Object.keys(formData.clusterWeights).map(cluster => (
                <div key={cluster} className="slider-group">
                  <label>{cluster}: {formData.clusterWeights[cluster]}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData.clusterWeights[cluster]}
                    onChange={(e) => {
                      const newValue = parseInt(e.target.value);
                      const total = Object.values(formData.clusterWeights).reduce((a, b) => a + b, 0) - formData.clusterWeights[cluster] + newValue;
                      if (total <= 100) {
                        setFormData({
                          ...formData,
                          clusterWeights: {
                            ...formData.clusterWeights,
                            [cluster]: newValue
                          }
                        });
                      }
                    }}
                  />
                </div>
              ))}
              <div className="weight-total">
                Total: {Object.values(formData.clusterWeights).reduce((a, b) => a + b, 0)}%
              </div>
            </div>

            {/* Sub-Trait Weighting (Accordion) */}
            <div className="subsection">
              <h4>Sub-Trait Weighting</h4>
              <p className="section-note">Expandable accordions expose atomic traits</p>
              <div className="trait-accordion">
                <button 
                  className="accordion-header"
                  onClick={() => setExpandedTraits({ ...expandedTraits, creation: !expandedTraits.creation })}
                >
                  <span>Creation Traits</span>
                  <span>{expandedTraits.creation ? '−' : '+'}</span>
                </button>
                {expandedTraits.creation && (
                  <div className="accordion-content">
                    <p className="trait-note">Passing Vision, Tempo Control, etc. (Values auto-normalize to 100%)</p>
                  </div>
                )}
              </div>
              <div className="trait-accordion">
                <button 
                  className="accordion-header"
                  onClick={() => setExpandedTraits({ ...expandedTraits, shooting: !expandedTraits.shooting })}
                >
                  <span>Shooting Traits</span>
                  <span>{expandedTraits.shooting ? '−' : '+'}</span>
                </button>
                {expandedTraits.shooting && (
                  <div className="accordion-content">
                    <p className="trait-note">3PT Range, Mid-Range, Free Throw, etc. (Values auto-normalize to 100%)</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Layer 4 - Program Financial Setup */}
          <section className="drawer-section">
            <h3>4. Program Financial Setup</h3>
            <div className="form-group">
              <label>Scholarship Cap *</label>
              <input
                type="number"
                value={formData.scholarshipCap}
                onChange={(e) => setFormData({ ...formData, scholarshipCap: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.1"
                placeholder="Total equivalency budget (e.g., 12 for D1)"
              />
            </div>
            <div className="form-group">
              <label>Scholarship Slots</label>
              <p className="section-note">0.1 – 1.0 per player (0.5 = half scholarship). Configure per player in Player IQ™.</p>
            </div>
            <div className="form-group">
              <label>NIL Pool ($) *</label>
              <input
                type="number"
                value={formData.nilPool}
                onChange={(e) => setFormData({ ...formData, nilPool: parseFloat(e.target.value) || 0 })}
                min="0"
                step="1000"
                placeholder="Total collective funds"
              />
            </div>
          </section>
        </div>

        <div className="drawer-footer">
          <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
          <button className="apply-btn" onClick={handleApply}>Apply</button>
        </div>
      </div>
    </>
  );
};

export default CoachingIQDrawer;

