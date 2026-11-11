# Fish Game Backend (fishback) 🌊

Node.js + Express + **MongoDB (Mongoose)** backend service for the **Swimming – Dive, Collect & Survive** (Fish Game) application.

## 🚀 Getting Started

### 1. Requirements
- Node.js (v18+ or v24+)
- MongoDB (Local MongoDB Community Server or MongoDB Atlas Cloud)

### 2. Environment Variables
Your `.env` file (`fishback/.env`) supports both local and cloud MongoDB:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_fish_game_jwt_key_2026
CLIENT_URL=http://localhost:5173

# Option A: Local MongoDB (Default)
MONGO_URI=mongodb://127.0.0.1:27017/fishgame

# Option B: Free Cloud MongoDB (MongoDB Atlas)
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/fishgame?retryWrites=true&w=majority
```

### 3. Running the Server

#### Development Mode (with hot-reload using nodemon):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

Server will run on: `http://localhost:5000`

---

## 🍃 MongoDB Collections & Schemas

### 1. `User` (`src/models/User.js`)
- `name`: Player display name (e.g., `OceanHero`, `Marc`, `Madhushi`)
- `email`: Player email (unique)
- `password`: Hashed with bcryptjs (pre-save hook)
- `avatar`: Player avatar emoji/image path
- `level`, `experience`, `score`, `coins`
- `totalFish`, `totalTreasures`
- `role`: `'student' | 'admin' | 'guest'`

### 2. `Leaderboard` (`src/models/Leaderboard.js`)
- `name`: Player name
- `score`: High score (sorted descending for ranks)

### 3. `GameHistory` (`src/models/GameHistory.js`)
- `playerName`: Player name
- `date`: Game date
- `score`, `fishes`, `treasures`
- `result`: `'Won' | 'Ended'`

---

## 📡 API Endpoints

- `GET /api/health` - Check server health
- `POST /api/auth/register` - Create user
- `POST /api/auth/login` - Authenticate (Supports Marc / hello26)
- `GET /api/auth/me` - Get profile (JWT Bearer Token)
- `PUT /api/auth/profile` - Update profile
- `GET /api/leaderboard` - Get sorted leaderboard
- `POST /api/leaderboard` - Submit score
- `GET /api/history` - Get game history
- `POST /api/history` - Record completed game round
- `GET /api/puzzle` - Marc Conrad Fish Math Puzzle proxy
