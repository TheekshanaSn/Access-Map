# AccessMap ♿🗺️

> A community-driven web and mobile platform helping wheelchair users, elderly people, and individuals with mobility impairments discover accessible public places, understand real-world accessibility conditions before visiting, and navigate obstacle-free routes.

---

## 🏗️ System Architecture

AccessMap is designed as a decoupled full-stack application structured for rapid iteration and future mobile expansion:

- **Frontend Client (`frontend/`)**: Modern Angular 21 (TypeScript, standalone components, reactive signals, Tailwind CSS v4) ready for Leaflet + OpenStreetMap integration in Phase 3.
- **Backend API (`backend/`)**: RESTful Node.js + Express + TypeScript service designed for geospatial querying with Mongoose and MongoDB 2dsphere indexing.
- **Future Mobile App**: Prepared to share models and business logic with an **Ionic + Angular + Capacitor** native shell.

```
Access-Map/
├── backend/                  # Express REST API (TypeScript)
│   ├── src/
│   │   ├── config/           # Database and environment loader
│   │   ├── controllers/      # Health & business handlers
│   │   ├── middleware/       # Error handling & CORS
│   │   ├── routes/           # API endpoints (/api/health, etc.)
│   │   └── server.ts         # Server bootstrapper
│   ├── .env.example          # Sample environment variables
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Angular 21 Single Page Application
│   ├── src/
│   │   ├── app/              # Standalone components & reactive services
│   │   └── environments/     # Environment configurations (dev, prod)
│   ├── proxy.conf.json       # Dev-server proxy to backend (port 5000)
│   ├── package.json
│   └── angular.json
├── package.json              # Root workspace orchestration scripts
└── .gitignore                # Root Git ignore rules
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (tested on Node.js v25)
- **npm**: v9+
- **MongoDB** *(Optional for Phase 1, required for Phase 2)*: Local instance (`mongodb://127.0.0.1:27017/accessmap`) or MongoDB Atlas URI.

---

### 1. Installation

From the project root:

```bash
# Option A: Install all dependencies at once
npm run install:all

# Option B: Install individually
cd backend && npm install
cd ../frontend && npm install
```

---

### 2. Environment Configuration

#### Backend Setup
The backend uses a `.env` file located in `backend/.env`. A template is provided at `backend/.env.example`:

```bash
cd backend
cp .env.example .env
```

Default variables:
```ini
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:4200
MONGODB_URI=mongodb://127.0.0.1:27017/accessmap
```

#### Frontend Setup
Frontend environments are managed in `frontend/src/environments/`:
- `environment.development.ts`: Points to `http://localhost:5000/api`
- `proxy.conf.json`: Proxies `/api` requests to backend during `ng serve`

---

### 3. Running the Applications

Open two terminal windows:

#### Terminal 1 — Start Backend Server
```bash
# From root
npm run dev:backend

# Or from backend folder
cd backend
npm run dev
```
Backend API will start at: **`http://localhost:5000`**  
Health Check endpoint: **`http://localhost:5000/api/health`**

#### Terminal 2 — Start Frontend Application
```bash
# From root
npm run dev:frontend

# Or from frontend folder
cd frontend
npm start
```
Frontend web application will open at: **`http://localhost:4200`**

---

### 4. Running Tests & Verifications

```bash
# Run backend typecheck
npm run typecheck:backend

# Build backend
npm run build:backend

# Run frontend unit tests
npm run test:frontend

# Build frontend production bundle
npm run build:frontend
```

---

## 🚦 Phase Roadmap

- [x] **Phase 1: Project Foundation & Health Verification**
  - Monorepo folder setup (`backend/` & `frontend/`)
  - Express.js + TypeScript REST API with `/api/health`
  - Angular standalone application with Tailwind CSS and telemetry UI
  - Environment variable isolation and `.gitignore` setup
- [ ] **Phase 2: Database Modeling & Places API**
  - MongoDB connection and Mongoose schemas (Place, AccessibilityReport, User)
  - GeoJSON 2dsphere indexing for location-based search
- [ ] **Phase 3: Interactive Leaflet Map & Discovery**
  - OpenStreetMap tiles with custom accessibility pins
  - Geolocation and filters (ramps, lifts, step-free, accessible toilets)
- [ ] **Phase 4: Crowdsourced Accessibility Reporting**
  - Community report submission form & obstacle alerts
- [ ] **Phase 5: Accessible Route Planning**
  - Wheelchair-friendly routing avoiding stairs and steep slopes
- [ ] **Phase 6: Ionic + Capacitor Mobile App**
  - Cross-platform packaging for iOS & Android
