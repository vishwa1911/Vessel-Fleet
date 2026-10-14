# VesselFleet | Smart Maritime Fleet Management & Voyage Optimization Platform

> **Enterprise Maritime Command Center** built with the **MERN stack** (MongoDB, Express.js, React, Node.js). Designed for shipping operators, marine superintendents, and logistics directors to monitor vessel operations, voyage scheduling, bunker fuel efficiency, preventative maintenance risk, and cargo delivery schedules in one unified platform.

---

## 1. System Overview & Problem Statement

Shipping companies face fragmented systems across ship registries, voyage charters, bunker telemetry, port manifests, and maintenance logs. This fragmentation causes schedule delays, excessive fuel burn, missed equipment overhauls, and logistics blind spots.

**VesselFleet** unifies these critical operations into an enterprise-grade command dashboard featuring:
- **Real-Time Fleet Visualization**: Global Leaflet map plotting active vessel positions with heading, status indicators, and port locations.
- **Voyage Routing & Scheduling**: Great-circle Haversine distance computations along sea corridors, automated double-booking prevention, route polyline visualization, and cross-track route deviation detection.
- **Bunker Fuel Analytics**: Tons/Day and Tons/NM metrics, price-derived bunkering costs, baseline variance flags, and deterministic rule-based speed/drag optimization suggestions.
- **Transparent Maintenance Risk Scoring**: Deterministic 0–100 rule-based risk scoring with factor weighting and plain-language inspection explanations (*strictly non-ML*).
- **Cargo Manifest Tracking**: End-to-end shipment lifecycle with state-transition validation (`Booked` &rarr; `Loaded` &rarr; `In Transit` &rarr; `Delayed` &rarr; `Delivered`) and automatic voyage delay cascading.
- **Centralized Alert Rules Engine**: Automated evaluation of delayed arrivals, excessive fuel consumption, overdue equipment maintenance, low fleet availability, route deviation, and cargo delivery risk.
- **Deterministic Route Simulation Engine**: Administrator-controlled simulation engine that moves vessels incrementally along waypoints, accumulates fuel usage, logs position breadcrumbs, and updates progress percentages.
- **Demo Database Reset**: 1-click restore function restoring ~12 commercial vessels, ~20 voyages, ~30 cargo manifests, fuel logs, and maintenance tasks.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS 3, React Router v6, Axios, Recharts, Leaflet & React-Leaflet, Lucide Icons |
| **Backend** | Node.js (v24), Express.js (v4.21), REST API |
| **Database** | MongoDB & Mongoose (v8.9), using native aggregation pipelines for all metrics |
| **Authentication** | JSON Web Tokens (JWT) with 24-hour expiration, bcrypt password hashing |
| **Security & Middleware** | Helmet, CORS, Morgan request logging, Express-Rate-Limit, Express-Validator |
| **Testing** | Jest (v29), Supertest (v7) — 14 automated test suites passing |

---

## 3. Role-Based Access Control (RBAC) Matrix

VesselFleet enforces strict role permissions on both the Express REST API middleware and client-side UI rendering:

| Module / Feature | Admin | Fleet Operator | Marine Engineer | Cargo Manager |
|---|:---:|:---:|:---:|:---:|
| **Fleet Dashboard** | Full | Full | Full | Full |
| **Vessels Registry** | Full CRUD | Read & Status Update | Read-Only | Read-Only |
| **Voyages & Routing** | Full CRUD | Full CRUD | Read-Only | Read-Only |
| **Fuel Analytics** | Full CRUD | Read-Only | Full CRUD | Read-Only |
| **Maintenance & Risk** | Full CRUD | Read-Only | Full CRUD | Read-Only |
| **Cargo Shipments** | Full CRUD | Read-Only | Read-Only | Full CRUD |
| **Alerts Resolution** | Full (Eval/Ack/Resolve) | Ack & Resolve | Ack & Resolve | Ack & Resolve |
| **Operational Settings** | Read & Update | Read-Only | Read-Only | Read-Only |
| **User Management** | Full CRUD | Forbidden | Forbidden | Forbidden |
| **Simulation & Demo Reset** | Start / Stop / Reset | Forbidden | Forbidden | Forbidden |

---

## 4. Default Demo Credentials

The platform includes 4 pre-configured demo user accounts for immediate evaluation:

| Role | Email Address | Password | Permissions Scope |
|---|---|---|---|
| **Administrator** | `admin@vesselfleet.com` | `Password123!` | Complete unrestricted access, system settings, user management, simulation controls, demo reset |
| **Fleet Operator** | `operator@vesselfleet.com` | `Password123!` | Vessel status updates, voyage scheduling, double-booking management, fleet monitoring |
| **Marine Engineer** | `engineer@vesselfleet.com` | `Password123!` | Preventative maintenance scheduling, running hours tracking, bunker fuel logging |
| **Cargo Manager** | `cargo@vesselfleet.com` | `Password123!` | Cargo registration, manifest tracking, shipment lifecycle state transitions |

> **Tip**: The login screen features **1-Click Demo Login** buttons for each role to facilitate instant testing.

---

## 5. Prerequisites & Environment Setup

- **Node.js**: v18.0.0 or higher (Tested on Node v24.18.0)
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/vesselfleet`) or MongoDB Atlas URI

### Environment Variables Configuration

The backend reads configuration from `server/.env`. A template is provided at `server/.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/vesselfleet
JWT_SECRET=vesselfleet_super_secure_jwt_secret_maritime_key_2026
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## 6. Installation & Execution Guide

### Step 1: Install Dependencies
From the repository root directory, run:
```bash
npm run install:all
```
*(Or install individually: `npm install`, `npm --prefix server install`, `npm --prefix client install`)*

### Step 2: Seed the Demo Database
Populate MongoDB with realistic maritime data (~12 vessels, 20 voyages, 30 cargo manifests, fuel logs, maintenance tasks):
```bash
npm run seed
```

### Step 3: Run the Application
Start both the backend server and frontend client concurrently:
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend App**: `http://localhost:5173`
- **API Documentation**: `http://localhost:5000/api/docs`

*Alternatively, run services in dedicated terminal tabs:*
```bash
# Terminal 1: Backend Express Server
npm run dev:server

# Terminal 2: Frontend Vite Client
npm run dev:client
```

---

## 7. Automated Testing Suite

Backend integration test suites are written with **Jest** and **Supertest**, verifying authentication, RBAC authorization, vessel CRUD, scheduling conflict prevention, and MongoDB dashboard aggregations.

Run all tests:
```bash
npm test
```

### Verified Test Suites:
- `tests/auth.test.js`: Valid login, invalid credentials rejection, Bearer token verification, route protection.
- `tests/vessels.test.js`: Paginated registry retrieval, status filtering, Admin vessel creation, non-Admin deletion rejection, rule-based risk score computation.
- `tests/voyages.test.js`: Voyage schedule retrieval, automatic Haversine distance computation, **vessel double-booking conflict prevention**.
- `tests/dashboard.test.js`: Real-time MongoDB aggregation metrics, KPI calculations, Recharts data series verification.

---

## 8. RESTful API Reference (`/api/*`)

All API responses follow a consistent JSON format:
- Success: `{ "success": true, "data": ..., "message": "..." }`
- Error: `{ "success": false, "message": "...", "errors": [...] }`

An interactive endpoint listing is available at `GET /api/docs`.

### Key Endpoints Overview:

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates credentials and returns JWT token |
| `GET` | `/api/auth/me` | Protected | Returns authenticated user profile and role |
| `GET` | `/api/dashboard/summary` | Protected | Aggregated fleet KPIs, cargo manifest summary, open alerts |
| `GET` | `/api/dashboard/charts` | Protected | Aggregations for fleet utilization, planned vs actual fuel, and costs |
| `GET` | `/api/vessels` | Protected | Paginated vessel list with search and filter parameters |
| `GET` | `/api/vessels/:id` | Protected | Comprehensive vessel overview, specs, telemetry, and tabs |
| `GET` | `/api/vessels/:id/risk-score` | Protected | Rule-based risk score (0-100) with factor weighting |
| `POST` | `/api/vessels` | Admin | Register new vessel with IMO validation |
| `GET` | `/api/voyages` | Protected | Paginated voyages with progress percentages |
| `POST` | `/api/voyages` | Admin / Operator | Create voyage with vessel double-booking conflict prevention |
| `GET` | `/api/voyages/:id` | Protected | Voyage waypoints polyline, fuel variance, and cross-track deviation |
| `GET` | `/api/fuel/analytics` | Protected | Total fuel consumption, average cost, and efficiency suggestions |
| `POST` | `/api/fuel` | Admin / Engineer | Log bunker fuel record with source tagging |
| `GET` | `/api/maintenance/risk-matrix`| Protected | Fleet-wide rule-based risk matrix sorted by urgency |
| `POST` | `/api/maintenance` | Admin / Engineer | Schedule equipment overhaul or inspection work order |
| `GET` | `/api/cargo` | Protected | Paginated cargo manifest tracking list |
| `PUT` | `/api/cargo/:id` | Admin / Cargo Mgr | Validate and progress shipment lifecycle state |
| `GET` | `/api/alerts` | Protected | Operational alert feed with severity and recommended actions |
| `POST` | `/api/alerts/evaluate` | Protected | Execute central alert rules engine against current database state |
| `PUT` | `/api/alerts/:id/acknowledge`| Protected | Acknowledge alert condition |
| `PUT` | `/api/alerts/:id/resolve` | Protected | Mark alert resolved with timestamp and auditor ID |
| `POST` | `/api/simulation/start` | Admin | Start simulation engine advancing vessels along waypoints |
| `POST` | `/api/simulation/stop` | Admin | Pause simulation engine |
| `POST` | `/api/simulation/step` | Admin | Advance simulation by 1 discrete progression cycle |
| `POST` | `/api/demo/reset` | Admin | Restore database to standard realistic demo dataset |

---

## 9. Simulation & Demo Data Disclosures

To maintain professional domain integrity and transparency:
1. **Simulated AIS Positions**: Vessel positions and speed vectors are generated by an internal mathematical progression model. They are clearly labeled with a purple `Demo / Simulated Data` badge in the UI and must not be interpreted as live commercial AIS satellite streams.
2. **Rule-Based Risk Engine**: Maintenance risk scores (0–100) are generated via deterministic operational rules (overdue tasks, critical priority open orders, engine hours exceeding service limits, and elapsed inspection intervals). **No black-box machine learning model is claimed.**
3. **Haversine Distance**: Voyage distances and ETAs are calculated using spherical trigonometry along major sea corridors (Malacca Strait, Suez Canal, Bab-el-Mandeb, Bay of Bengal, and Singapore–Rotterdam corridors).

---

## 10. Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `PSSecurityException: npm.ps1 cannot be loaded` | Windows PowerShell execution policy restricts `.ps1` scripts | Use `npm.cmd` instead of `npm`, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017` | MongoDB service is not started | Start the Windows MongoDB service: `net start MongoDB` or verify `mongod` is running |
| `Vessel is already booked during this timeframe` | Double-booking prevention algorithm triggered | Select a vessel that has no overlapping active or planned voyages during the chosen departure/arrival dates |
| Port 5000 or 5173 already in use | Another process is occupying the dev port | Terminate the occupying process or edit `PORT` in `server/.env` and `client/vite.config.js` |
