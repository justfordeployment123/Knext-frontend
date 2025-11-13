import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutPage.css';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <header className="about-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </header>

      <div className="about-content">
        <h1>About KaNeXT IQ™</h1>
        <div className="about-section">
          <h2>The Future of Sports Intelligence</h2>
          <p>
            KaNeXT IQ™ is a comprehensive basketball analytics platform designed to revolutionize 
            how coaches evaluate players, build rosters, and make strategic decisions.
          </p>
        </div>

        <div className="about-section">
          <h2>Core Modules</h2>
          <ul>
            <li><strong>Player IQ™</strong> - Advanced player evaluation and scouting</li>
            <li><strong>Team IQ™</strong> - Roster management and system alignment</li>
            <li><strong>Recruiting IQ™</strong> - National prospect database and pipeline management</li>
            <li><strong>PrediXt™</strong> - Game and season simulation engine</li>
            <li><strong>Coaching IQ™</strong> - System configuration and bias settings</li>
          </ul>
        </div>

        <div className="about-section">
          <h2>Powered by AI</h2>
          <p>
            Coach K™, our AI assistant, provides contextual guidance throughout your coaching journey, 
            helping you make data-driven decisions with confidence.
          </p>
        </div>

        <div className="about-cta">
          <button className="primary-btn" onClick={() => navigate('/login')}>
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;

