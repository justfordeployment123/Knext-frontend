import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Icon from './Icon';
import './ModulePanels.css';

const modules = [
  {
    id: 'player-iq',
    name: 'Player IQ™',
    description: 'Evaluate, grade, and benchmark individual players across systems and archetypes.',
    route: '/player-iq',
    icon: 'user'
  },
  {
    id: 'recruiting-iq',
    name: 'Recruiting IQ™',
    description: 'Manage recruiting board, commit status, offers, and financial allocations.',
    route: '/recruiting-iq',
    icon: 'clipboard'
  },
  {
    id: 'team-iq',
    name: 'Team IQ™',
    description: 'Manage roster composition, system alignment, and aggregate KPI readiness.',
    route: '/team-iq',
    icon: 'team'
  },
  {
    id: 'predixt',
    name: 'PrediXt™',
    description: 'Run match simulations and forecast outcomes using current Team IQ and Coaching IQ profiles.',
    route: '/predixt',
    icon: 'chart'
  }
];

const ModulePanels = () => {
  const navigate = useNavigate();
  const { coachingBias, addCoachKMessage, teamState } = useApp();
  const [hoveredModule, setHoveredModule] = useState(null);

  const handleModuleClick = (module) => {
    // Generate contextual prompt
    const prompts = {
      'player-iq': "Let's analyze your roster next.",
      'team-iq': "Opening Team IQ workspace…",
      'recruiting-iq': "Opening Recruiting IQ workspace…",
      'predixt': "Opening PrediXt workspace…"
    };

    addCoachKMessage({
      speaker: 'Coach K',
      message: prompts[module.id] || `Opening ${module.name} workspace...`,
      type: 'info'
    });

    navigate(module.route);
  };

  const getSystemSummary = () => {
    if (!coachingBias) return null;
    const offense = coachingBias.offensiveSystem || 'Not Set';
    const defense = coachingBias.defensiveSystem || 'Not Set';
    return `${offense} / ${defense}`;
  };

  return (
    <div className="module-panels">
      <div className="panels-grid">
        {modules.map((module) => (
          <div
            key={module.id}
            className={`module-panel ${hoveredModule === module.id ? 'hovered' : ''}`}
            onClick={() => handleModuleClick(module)}
            onMouseEnter={() => setHoveredModule(module.id)}
            onMouseLeave={() => setHoveredModule(null)}
          >
            <div className="module-icon">
              <Icon name={module.icon} size={32} color="#D4AF37" />
            </div>
            <h3 className="module-name">{module.name}</h3>
            <p className="module-description">{module.description}</p>
            {(module.id === 'team-iq' || module.id === 'predixt') && getSystemSummary() && (
              <div className="module-system-summary">
                {getSystemSummary()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModulePanels;

