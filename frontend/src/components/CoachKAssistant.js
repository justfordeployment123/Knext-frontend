import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import './CoachKAssistant.css';

const CoachKAssistant = () => {
  const navigate = useNavigate();
  const { coachKState, setCoachKState, coachingBias, coachProfile } = useApp();
  const [inputText, setInputText] = useState('');
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [coachKState.messages, currentMessageIndex]);

  // Auto-open and start onboarding on first visit
  useEffect(() => {
    if (coachKState.isOpen && coachKState.currentStage === 'stage1' && currentMessageIndex === 0) {
      startStage1();
    }
  }, [coachKState.isOpen, coachKState.currentStage]);

  // Monitor coachingBias changes to advance stages
  useEffect(() => {
    if (coachingBias && coachKState.currentStage === 'stage2') {
      // Coaching IQ setup completed, move to Stage 3
      setTimeout(() => {
        startStage3();
      }, 1500);
    }
  }, [coachingBias]);

  const startStage1 = () => {
    const stage1Messages = [
      {
        id: 'K_STAGE1_1',
        speaker: 'Coach K',
        message: 'Welcome, Coach. This is your KaNeXT IQ™ Office — your command center for Basketball IQ™.',
        type: 'info',
        action: 'glow-header'
      },
      {
        id: 'K_STAGE1_2',
        speaker: 'Coach K',
        message: 'Everything you control — systems, players, recruiting, and simulations — starts here.',
        type: 'info',
        action: 'pulse-grid'
      },
      {
        id: 'K_STAGE1_3',
        speaker: 'Coach K',
        message: "Let's make sure your coaching philosophy is set before we start evaluating.",
        type: 'info',
        action: 'next-stage'
      }
    ];

    setCoachKState(prev => ({
      ...prev,
      messages: stage1Messages,
      currentStage: 'stage1'
    }));
    setCurrentMessageIndex(0);
    showNextMessage(stage1Messages, 0);
  };

  const startStage2 = () => {
    if (coachingBias) {
      // Skip Stage 2 if coaching bias already exists
      startStage3();
      return;
    }

    const stage2Messages = [
      {
        id: 'K_STAGE2_1',
        speaker: 'Coach K',
        message: 'Every coach sees the game differently. Coaching IQ™ lets you define how you value players.',
        type: 'info',
        action: 'pulse-brain'
      },
      {
        id: 'K_STAGE2_2',
        speaker: 'Coach K',
        message: 'Click the 🧠 icon to open your drawer and set your offensive and defensive systems.',
        type: 'info',
        action: 'tooltip-brain'
      },
      {
        id: 'K_STAGE2_3',
        speaker: 'Coach K',
        message: "Adjust positional and trait weights until they match your philosophy. I'll wait right here.",
        type: 'info',
        action: 'wait-for-apply'
      }
    ];

    setCoachKState(prev => ({
      ...prev,
      messages: stage2Messages,
      currentStage: 'stage2'
    }));
    setCurrentMessageIndex(0);
    showNextMessage(stage2Messages, 0);
  };

  const startStage3 = () => {
    const stage3Messages = [
      {
        id: 'K_STAGE3_1',
        speaker: 'Coach K',
        message: coachingBias 
          ? 'Excellent. Your Coaching IQ™ profile is locked in — this defines how every player will be interpreted.'
          : 'Player IQ™ is where your data foundation begins. We\'ll grade each player through your system lens.',
        type: coachingBias ? 'success' : 'info',
        action: coachingBias ? 'glow-context' : 'highlight-player-iq'
      },
      {
        id: 'K_STAGE3_2',
        speaker: 'Coach K',
        message: 'Once players are evaluated, I\'ll open up Recruiting IQ™ and Team IQ™ next.',
        type: 'info',
        action: 'grey-out-modules'
      },
      {
        id: 'K_STAGE3_3',
        speaker: 'Coach K',
        message: 'Ready to start scouting?',
        type: 'info',
        action: 'show-buttons'
      }
    ];

    setCoachKState(prev => ({
      ...prev,
      messages: stage3Messages,
      currentStage: 'stage3'
    }));
    setCurrentMessageIndex(0);
    showNextMessage(stage3Messages, 0);
  };

  const showNextMessage = (messages, index) => {
    if (index >= messages.length) {
      // Stage complete, check if we need to advance
      if (messages[0]?.id === 'K_STAGE1_3') {
        setTimeout(() => startStage2(), 500);
      }
      return;
    }

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setCurrentMessageIndex(index);
      
      // Handle message actions
      const message = messages[index];
      if (message.action === 'next-stage' && index === messages.length - 1) {
        setTimeout(() => startStage2(), 1500);
      }

      // Auto-advance to next message after 1.5s or wait for user click
      if (index < messages.length - 1) {
        setTimeout(() => {
          showNextMessage(messages, index + 1);
        }, 1500);
      }
    }, 300);
  };

  const handleMessageClick = () => {
    const currentStageMessages = coachKState.messages;
    if (currentMessageIndex < currentStageMessages.length - 1) {
      showNextMessage(currentStageMessages, currentMessageIndex + 1);
    } else {
      // Last message clicked, advance stage if needed
      if (coachKState.currentStage === 'stage1') {
        startStage2();
      } else if (coachKState.currentStage === 'stage2' && coachingBias) {
        startStage3();
      }
    }
  };

  const handleMinimize = () => {
    setCoachKState(prev => ({ 
      ...prev, 
      isOpen: false,
      isMinimized: true 
    }));
  };

  const handleToggle = () => {
    setCoachKState(prev => ({
      ...prev,
      isOpen: !prev.isOpen,
      isMinimized: false
    }));
  };

  const handleQuickAction = (action) => {
    if (action === 'Go to Player IQ™') {
      setCoachKState(prev => ({
        ...prev,
        messages: [...prev.messages, {
          id: 'K_STAGE3_4',
          speaker: 'Coach K',
          message: "Let's build your foundation.",
          type: 'info'
        }]
      }));
      setTimeout(() => {
        handleMinimize();
        navigate('/player-iq');
      }, 1000);
    } else if (action === 'Review Coaching IQ™') {
      const event = new CustomEvent('openCoachingIQDrawer');
      window.dispatchEvent(event);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: `user_${Date.now()}`,
      speaker: 'Coach',
      message: inputText,
      type: 'user'
    };

    setCoachKState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    setInputText('');
    
    // Simple response
    setTimeout(() => {
      const responseMessage = {
        id: `coach_k_${Date.now()}`,
        speaker: 'Coach K',
        message: 'I understand. Let me help you with that.',
        type: 'info'
      };
      setCoachKState(prev => ({
        ...prev,
        messages: [...prev.messages, responseMessage]
      }));
    }, 500);
  };

  const handleSkipIntro = () => {
    if (coachingBias) {
      startStage3();
    } else {
      startStage2();
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && coachKState.isOpen) {
        handleMinimize();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [coachKState.isOpen]);

  // Minimized bubble state
  if (coachKState.isMinimized && !coachKState.isOpen) {
    return (
      <div 
        className="coach-k-bubble" 
        onClick={handleToggle} 
        title="Chat with Coach K™"
      >
        🤖
      </div>
    );
  }

  // Expanded panel state
  if (!coachKState.isOpen) {
    return null;
  }

  const displayedMessages = coachKState.messages.slice(0, currentMessageIndex + 1);
  const isStage3Complete = coachKState.currentStage === 'stage3' && currentMessageIndex >= coachKState.messages.length - 1;

  return (
    <div className="coach-k-assistant" ref={chatRef}>
      <div className="coach-k-header">
        <div className="header-title">
          <span className="coach-k-icon">🤖</span>
          <span className="name">Coach K™</span>
        </div>
        <div className="header-actions">
          <button className="minimize-btn" onClick={handleMinimize} title="Minimize">−</button>
          <button className="close-btn" onClick={handleMinimize} title="Close">&times;</button>
        </div>
      </div>

      <div className="coach-k-chat">
        {displayedMessages.map((msg, index) => (
          <div 
            key={msg.id || index} 
            className={`chat-message ${msg.type}`}
            onClick={index === displayedMessages.length - 1 ? handleMessageClick : undefined}
            style={{ cursor: index === displayedMessages.length - 1 ? 'pointer' : 'default' }}
          >
            <div className="message-speaker">{msg.speaker}</div>
            <div className="message-content">{msg.message}</div>
          </div>
        ))}
        {isTyping && (
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {isStage3Complete && (
        <div className="coach-k-actions">
          <button 
            className="action-btn" 
            onClick={() => handleQuickAction('Go to Player IQ™')}
          >
            Go to Player IQ™
          </button>
          {!coachingBias && (
            <button 
              className="action-btn secondary" 
              onClick={() => handleQuickAction('Review Coaching IQ™')}
            >
              Review Coaching IQ™
            </button>
          )}
        </div>
      )}

      {coachKState.currentStage === 'stage1' && currentMessageIndex > 0 && (
        <div className="coach-k-actions">
          <button className="action-btn secondary" onClick={handleSkipIntro}>
            Skip Intro
          </button>
        </div>
      )}

      <div className="coach-k-input">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Ask Coach K anything..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default CoachKAssistant;
