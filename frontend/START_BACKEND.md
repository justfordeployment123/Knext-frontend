# Starting the Backend Server

## Quick Start

1. **Navigate to backend folder:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the server:**
```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

The server will start on `http://localhost:3001`

## Verify It's Running

Open your browser or use curl:
```bash
curl http://localhost:3001/api/health
```

You should see:
```json
{
  "success": true,
  "message": "KaNeXT IQ Backend API is running",
  "timestamp": "2024-..."
}
```

## Frontend Connection

The frontend is already configured to connect to `http://localhost:3001/api` by default.

To change the API URL, create a `.env` file in the root directory:
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_USE_REAL_API=true
```

## Troubleshooting

### Port Already in Use
If port 3001 is already in use, change it in `backend/.env`:
```
PORT=3002
```

### CORS Issues
Make sure `FRONTEND_URL` in `backend/.env` matches your frontend URL.

### Database File
The database file is created automatically at `backend/data/users.json` on first run.

