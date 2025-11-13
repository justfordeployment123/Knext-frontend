# KaNeXT IQ™ - Basketball Intelligence Platform

## 🏀 The Future of Sports Intelligence

KaNeXT IQ™ is a comprehensive basketball analytics and intelligence platform designed for coaches, featuring AI-powered player evaluation, roster management, recruiting intelligence, and game prediction capabilities.

## ✨ Features

### 💎 Landing Page
- Full-screen hero section with brand identity
- Clean navigation to Login and About sections
- Gold accent (#D4AF37) on black design theme

### 🔐 Login / Create Account
- Dual-mode authentication interface
- Coach profile creation with team and system setup
- Integrated offensive/defensive system selection

### 🏢 Office Dashboard
- Central command center for all modules
- Real-time context bar showing team, system, and roster stats
- Coaching IQ™ drawer for philosophy and bias configuration
- Coach K™ AI Assistant with contextual guidance
- Quick access to all core modules

### 👤 Player IQ™
- **Lifeline Scope**: AI-enhanced player search and verification
- **Confidence Gate**: Data quality validation (0-100% confidence)
- **Full KPI Evaluation**: Comprehensive player scoring with system fit analysis
- **Financial Intelligence**: Scholarship and NIL value suggestions
- **Decision & Sync**: Direct integration with Team IQ™ and Recruiting IQ™

### 🏀 Team IQ™
- **Roster View**: Complete roster table with live metrics
- **Depth Chart**: Positional breakdown and lineup visualization
- **Team Metrics**: Aggregate KPI, System Fit %, Scholarship Usage, NIL utilization
- **Player Management**: Add, edit, and remove roster members
- **Financial Tracking**: Real-time budget monitoring

### 📋 Recruiting IQ™
- **National Player Database**: JUCO, NAIA, NCAA D1-D3 player pools
- **Advanced Filtering**: By division, position, class, and region
- **List & Board Views**: Flexible visualization modes
- **Recruiting Board**: Active prospect management with status tracking
- **Priority View**: Focus on top recruiting targets

### 📊 PrediXt™
- **Single Game Simulation**: Head-to-head matchup predictions
- **Season Projection**: Full-season record forecasting
- **Win Probability**: Data-driven outcome predictions
- **Coach K™ Analysis**: AI-powered strategic insights
- **Team IQ™ Integration**: Live roster-based simulations

### 🤖 Coach K™ AI Assistant
- Context-aware guidance throughout platform
- Stage-based onboarding for new users
- Real-time feedback on roster changes and evaluations
- Financial impact analysis
- Strategic recruiting recommendations

## 🎨 Design System

- **Primary Color**: `#000000` (Black)
- **Text Color**: `#FFFFFF` (White)
- **Accent Color**: `#D4AF37` (Gold)
- **Typography**: Inter font family
- **Animations**: 150ms transitions, fade-in effects
- **Responsive**: Mobile-first design approach

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd rough
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

### Running the Application

#### Option 1: Start Both Servers (Recommended)
```bash
# Start both frontend and backend
./start-dev.sh
```

#### Option 2: Start Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Backend runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
npm start
# Frontend runs on http://localhost:3000
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Backend API

The backend server provides JWT authentication:
- **Port**: 3001
- **Health Check**: http://localhost:3001/api/health
- **API Base URL**: http://localhost:3001/api

See `backend/README.md` for detailed API documentation.

## 📁 Project Structure

```
rough/
├── backend/                 # Backend API Server
│   ├── server.js           # Express server with JWT auth
│   ├── package.json
│   ├── .env                # Environment variables
│   ├── data/               # JSON database (auto-created)
│   └── README.md
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── OfficeHeader.js
│   │   ├── CoachingIQDrawer.js
│   │   ├── ModulePanels.js
│   │   ├── CoachKAssistant.js
│   │   └── ProtectedRoute.js
│   ├── context/
│   │   └── AppContext.js
│   ├── pages/
│   │   ├── LandingPage.js
│   │   ├── LoginPage.js
│   │   ├── OfficePage.js
│   │   ├── PlayerIQPage.js
│   │   ├── TeamIQPage.js
│   │   ├── RecruitingIQPage.js
│   │   └── PrediXtPage.js
│   ├── services/
│   │   ├── authService.js  # JWT authentication
│   │   └── api.js          # API client
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── start-dev.sh           # Start both servers
└── README.md
```

## 🔧 Core Technologies

### Frontend
- **React 18** - UI framework
- **React Router v6** - Client-side routing
- **Context API** - Global state management
- **LocalStorage** - Data persistence
- **CSS3** - Styling with custom properties

### Backend
- **Express.js** - Web server framework
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **JSON File Storage** - Simple database (easily replaceable)

## 💾 Data Management

The application uses React Context API for state management and localStorage for persistence:

- **Coach Profile**: User account and team information
- **Coaching Bias**: System preferences and financial parameters
- **Team State**: Active roster and aggregate metrics
- **Player Profiles**: Evaluated player database
- **Recruiting State**: Active recruits and board management

## 🎯 Key Workflows

### 1. First-Time Setup
1. Create account with team details
2. Configure Coaching IQ™ (systems, bias, financials)
3. Coach K™ guides through initial setup

### 2. Player Evaluation
1. Search player via Lifeline Scope
2. Review confidence and identity verification
3. Run full KPI evaluation
4. Sync to Team IQ™ or Recruiting IQ™

### 3. Roster Building
1. Evaluate players in Player IQ™
2. Add verified players to Team IQ™
3. Monitor financial allocations
4. Optimize depth chart composition

### 4. Recruiting
1. Browse national player database
2. Filter by division, position, class
3. Add prospects to recruiting board
4. Track scholarship and NIL offers

### 5. Game Prediction
1. Build roster in Team IQ™
2. Run single-game or season simulation
3. Review win probabilities and projections
4. Adjust roster based on insights

## 🔐 Authentication

The application uses JWT-based authentication:
- User registration with password hashing
- Secure login with token generation
- Protected routes requiring authentication
- Token expiration (24 hours)
- Automatic token validation

See `AUTHENTICATION.md` and `backend/README.md` for detailed documentation.

## 🔮 Future Enhancements

- Real-time data synchronization
- Advanced analytics dashboards
- Video integration for player evaluation
- Mobile native applications
- Multi-sport expansion
- Database migration (MongoDB/PostgreSQL)

## 📄 License

Proprietary - All rights reserved

## 🤝 Contact

For questions or support, please contact the development team.

---

**Built with ⚡ by the KaNeXT IQ™ Team**

*The Future of Sports Intelligence*


