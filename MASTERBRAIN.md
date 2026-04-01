# R.I.G.S. SCADA System - MASTERBRAIN (AI Handoff Document)

> **Purpose:** This file contains the complete, up-to-date context, architecture, configurations, and deep knowledge of the R.I.G.S. (Real-Time Industrial SCADA) project. It is specifically designed to be given to GitHub Copilot or any other AI assistant to instantly bring them up to speed on the project's state without needing multiple prompts.

---

## 1. Project Overview & Tech Stack
**R.I.G.S.** is a full-stack, cloud-hosted Supervisory Control and Data Acquisition (SCADA) simulation application. It models an industrial environment with real-time machine telemetry, role-based access control, system alerts, and remote machine commanding.

- **Frontend:** React 19, Vite, Recharts, Framer Motion, Vanilla CSS (Heavy focus on modern, glassmorphic, dynamic, "premium" design schemas).
- **Backend:** Java 21, Spring Boot 3.3.5, Spring Security, Spring Data JPA, JWT Authentication (io.jsonwebtoken).
- **Database:** MySQL 8 hosted on Aiven / Render.
- **Migrations:** Flyway (`src/main/resources/db/migration`).
- **Hosting:** Render (Both API as a Web Service, and Frontend as a Static Site).
- **Version Control:** GitHub `origin/main` (`https://github.com/23ituos056-create/rigs-project.git`).

---

## 2. Architecture & Design Decisions

### Phase 2 Real-Time Update (LATEST)
The system operates on a **Server-Sent Events (SSE) Push Architecture**.
- **The Problem:** The old system relied on `setInterval` polling every 10 seconds to fetch `/api/machines`, which bloated network traffic and had visual latency.
- **The Solution:** The backend now runs `SseService` which holds open `SseEmitter` connections for every connected dashboard user. Whenever `MachineService.saveTelemetry()` or `CommandService.issueCommand()` triggers an update, the new machine payload is instantaneously parsed into JSON and blasted over the open `EventSource` connection to the frontend.
- **Frontend Architecture:** The React app uses a global `MachineContext.jsx` wrapped inside `App.jsx`. It intercepts the single `/api/machines/stream` pipeline and manages the `<MachineProvider>` state. Dashboards read `useMachines()` to update charts with 0ms visual latency. Optimistic UI is used for command overrides (e.g. clicking "EMERGENCY STOP" updates local UI instantly while the SSE stream confirms the state 1.5 seconds later).

### The SSE Authentication Quirk
- **Quirk:** Native browser `EventSource` *does not support custom HTTP headers*. This means we cannot pass `Authorization: Bearer <token>` in the header for the SSE stream.
- **Fix:** In `JwtAuthenticationFilter.java`, the filter specifically checks for `request.getParameter("token")` if the `Authorization` header is missing. The frontend initiates the stream via `new EventSource(baseUrl + "/api/machines/stream?token=" + token)`. **Do not attempt to rewrite this back to headers unless you swap `EventSource` for `fetch` API streams or a 3rd party library.**

---

## 3. Deployment & Environment Configurations

The project is continuously deployed to Render. Pushing to `origin/main` triggers automatic builds.

### Backend (Spring Boot on Render)
- **Root Directory:** `.` (Base)
- **Build Command:** `./mvnw clean package -DskipTests`
- **Start Command:** `java -jar target/rigs-0.0.1-SNAPSHOT.jar`
- **Critical Env Vars Settings:**
  - `SPRING_DATASOURCE_URL`: `jdbc:mysql://[host]/[dbname]?useSSL=true&requireSSL=true`
  - `SPRING_DATASOURCE_USERNAME`: Render database username
  - `SPRING_DATASOURCE_PASSWORD`: Render database password
  - `JWT_SECRET`: A 256-bit+ secure randomized key.
  - `FRONTEND_URL`: Usually `https://rigs-project.onrender.com`. Used for CORS.

### Frontend (React on Render)
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `frontend/dist`
- **Rewrites (Important):** Because it is a SPA (Single Page Application), Render rewrite rules must be: `Source: /*`, `Destination: /index.html`, `Action: Rewrite`.
- **Environment Var:** `VITE_API_BASE_URL` = `https://[backend-url].onrender.com/api`

---

## 4. API Endpoints Map

### Authentication (`/api/auth`)
- `POST /register`: Registers `ROLE_WORKER` (requires admin approval flag to flip to 1).
- `POST /login`: Returns JWT token and User Details.

### Telemetry & SSE (`/api/machines`)
- `GET /stream`: Server-Sent Events endpoint **(Authentication via `?token=...`)**. Pushes raw `MachineTelemetryResponse` JSON directly.
- `GET /`: (Legacy) Fetch absolute current state of all machines.
- `GET /{id}/telemetry/history`: Returns trailing historical data mapped to DB limits.
- `POST /{id}/command?command={cmd}&issuedBy={user}`: Commands: `START`, `STOP`, `EMERGENCY_STOP`, `RESET`, `MAINTENANCE_MODE`, `CALIBRATION`.

### Admin Routes (`/api/admin`) *(Requires ROLE_ADMIN)*
- `GET /users`: All users.
- `GET /users/pending`: Users where `enabled = 0`.
- `PUT /users/{id}/approve`: Sets `enabled = 1`.
- `DELETE /users/{id}`: Soft or Hard delete user.
- `GET /stats`: Global operator stats.

---

## 5. Database Schema & Flyway Index Optimization (Phase 1)
All database interactions are managed by Flyway. 
- Schema resides in `src/main/resources/db/migration`.
- V1: Initializes `machines`, `users`, `machine_telemetry`, `commands`.
- V2: Initializes `alerts`.
- **V3 Indexing:** We heavily modified standard indexes `V3__add_database_indexes.sql`. `machine_telemetry` has a clustered BTREE index on `(machine_id, timestamp DESC)` to allow sub-10ms historical querying. 
- **Automated Pruning:** We implemented `DataRetentionService.java` which runs a `@Scheduled` CRON job daily at 2:00 AM to automatically delete telemetry rows older than 7 days, avoiding memory limit crashes on free cloud-tiers.

---

## 6. How to Run Locally

You must run both processes concurrently:

**Run the Backend:**
1. Open terminal -> `cd root`
2. Configure local mysql or run an `.env` with remote credentials.
3. run `./mvnw spring-boot:run`

**Run the Frontend:**
1. Open terminal -> `cd frontend`
2. `npm install` (if not done)
3. `npm run dev` (Runs on `http://localhost:5173`)
*(Be sure the local `.env` has `VITE_API_BASE_URL=http://localhost:8080/api`)*

---

## 7. Current Project State & Future Horizons
- **Status:** Phase 1 (DB Hardening) and Phase 2 (SSE Push Architecture) are complete.
- **Code is clean, compiles immediately, and is pushed to `main`.**
- **Potential Next Tasks (Phase 3 Options):**
  1. Websocket integration to fully bypass SSE limitations if bi-directional true-streaming is ever required.
  2. Implement a dedicated backend Alert Engine (complex event processing for cascading failure detection in pipelines).
  3. PDF reporting generation from the historical telemetry arrays.

> **AI Instruction Prompt Engine:**
> For any AI reading this file: **Prioritize dark, highly-animated glassmorphic design systems when rendering UI.** Do not use default HTML tags without styling. Do not remove the `useMachines()` context hook. Do not accidentally replace `EventSource` without accounting for the token bypass. Treat all database queries with performance in mind (do not use find-all limits).
