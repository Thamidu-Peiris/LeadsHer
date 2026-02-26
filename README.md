# LeadsHer

Backend and API for LeadsHer — Node/Express microservices with an API gateway.

## Architecture

- **Single repo.** Backend lives in `backend/` as multiple services.
- **API Gateway** (`api-gateway`) on port **5000** — single entry point for the frontend.
- **Microservices** run on dedicated ports; gateway proxies requests to them.

| Service            | Port | Base path        | Description                    |
|--------------------|------|------------------|--------------------------------|
| API Gateway        | 5000 | —                | Proxies to all services       |
| Auth Service       | 5001 | `/api/auth`      | User management & JWT auth     |
| Story Service      | 5002 | `/api/stories`   | Stories, comments, likes       |
| Mentorship Service | 5003 | `/api/mentors`, `/api/mentorship` | Mentors & requests   |
| Resource Service   | 5004 | `/api/resources` | Resources & uploads            |
| Forum Service      | 5005 | `/api/forum`     | Forum / discussions            |
| Event Service      | 5006 | (via gateway)    | Events                         |

**Database:** MongoDB (e.g. local or Atlas). Docker Compose runs Mongo on `27017`.

---

## Quick start

### 1. Clone and prepare env

```bash
git clone <your-repo-url> LeadsHer
cd LeadsHer
```

Create `backend/.env` (copy from `backend/services/auth-service/.env.example` or use):

```env
MONGODB_URI=mongodb://localhost:27017/leadsher
JWT_SECRET=your-secret-at-least-32-characters-long
JWT_EXPIRES_IN=7d
```

Add any optional vars (SMTP, Google OAuth, Cloudinary) as needed.

### 2. Run with Docker Compose

From the **repo root** (where `docker-compose.yml` is):

```bash
cd backend
npm run up
```

Or from repo root:

```bash
docker compose -f docker-compose.yml up -d --build
```

- **Gateway:** `http://localhost:5000`
- **Health checks:** e.g. `http://localhost:5000/health` (if gateway exposes it) or `http://localhost:5001/health`, `http://localhost:5002/health`, etc.

### 3. Run a single service locally (no Docker)

Install and run one service, e.g. story-service:

```bash
cd backend/services/story-service
npm install
```

Ensure MongoDB is running and `backend/.env` (or `backend/services/story-service/.env`) has `MONGODB_URI` and `JWT_SECRET`. Then:

```bash
npm run dev
```

Story service will listen on port **5002** (or `STORY_SERVICE_PORT`).

---

## API overview

Use the **gateway** at `http://localhost:5000` so paths below are under that host (e.g. `http://localhost:5000/api/auth/...`). When running a service alone, use its port (e.g. `http://localhost:5002/api/stories/...`).

### Auth (Auth Service)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register (name, email, password, optional role) | No |
| POST | `/api/auth/login` | Login (email, password) | No |
| POST | `/api/auth/verify-email` | Verify email | No |
| POST | `/api/auth/google` | Google OAuth | No |
| POST | `/api/auth/forgot-password` | Request password reset (body: email) | No |
| POST | `/api/auth/reset-password` | Reset with token (body: token, newPassword) | No |
| GET | `/api/auth/profile` | Current user profile | Bearer JWT |
| PUT | `/api/auth/profile` | Update profile (name, avatar, bio) | Bearer JWT |
| POST | `/api/auth/logout` | Logout (client discards token) | Bearer JWT |

**Protected requests:** `Authorization: Bearer <jwt_token>`.

**Roles:** `Admin`, `Mentor`, `Mentee` (default: `Mentee`).

---

### Stories (Story Service)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/stories/featured` | Featured stories | No |
| GET | `/api/stories/user/:userId` | Stories by user | No |
| GET | `/api/stories` | List stories (pagination, category, search, tag) | Optional |
| GET | `/api/stories/:id` | Story by ID | Optional |
| GET | `/api/stories/:id/comments` | Comments for a story | No |
| POST | `/api/stories` | Create story | Bearer JWT |
| POST | `/api/stories/upload` | Upload story media (image/video) | Bearer JWT |
| PUT | `/api/stories/:id` | Update story | Bearer JWT |
| DELETE | `/api/stories/:id` | Delete story | Bearer JWT |
| POST | `/api/stories/:id/like` | Toggle like | Bearer JWT |
| POST | `/api/stories/:id/comments` | Add comment | Bearer JWT |

Query params for `GET /api/stories`: `page`, `limit`, `category`, `sort`, `search`, `tag`, `author`, `from`, `to`, `featured`.

---

### Other services

- **Mentorship:** `/api/mentors`, `/api/mentorship`, `/api/mentorship/requests`
- **Resources:** `/api/resources`
- **Forum:** `/api/forum`
- **Events:** (routed via gateway)

---

## Project structure

```
LeadsHer/
├── docker-compose.yml          # Mongo + all services + API gateway
├── api-gateway/                # Gateway (port 5000)
└── backend/
    ├── package.json            # Workspace root (auth, story, mentorship, resource)
    ├── .env                    # Shared env (create from auth-service/.env.example)
    └── services/
        ├── auth-service/       # Port 5001
        ├── story-service/     # Port 5002
        ├── mentorship-service/ # Port 5003
        ├── resource-service/  # Port 5004
        ├── forum-service/     # Port 5005
        └── event-service/     # Port 5006
```

Each service typically has:

- `src/` — `index.js`, `app.js`, `server.js`, `config/`, `controllers/`, `middleware/`, `models/`, `routes/`, `services/`
- `Dockerfile`
- `package.json`

---

## Deployment

This section describes how to deploy the LeadsHer backend (API Gateway + microservices) to a hosted environment.

### Deployment overview

- **Database:** Use a hosted MongoDB instance (e.g. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)) for production. Do not rely on a containerized Mongo for production unless you manage backups and persistence.
- **Services:** Each backend service (auth, story, mentorship, resource, forum, event) and the API gateway can be deployed as separate services, or as a single Docker Compose stack on a VPS.
- **Environment:** All services need the same `JWT_SECRET` and a shared `MONGODB_URI` (or per-service if you use separate DBs).

### Required environment variables (production)

Set these for every backend service and the gateway (if it forwards auth headers or needs config):

| Variable        | Required | Description |
|----------------|----------|-------------|
| `MONGODB_URI`  | Yes      | MongoDB connection string (e.g. Atlas URI with username, password, and database name). |
| `JWT_SECRET`   | Yes      | Secret key for signing JWTs (use a long, random string in production). |
| `JWT_EXPIRES_IN` | No     | Token expiry (e.g. `7d`). Defaults often applied in code. |
| `PORT`         | No       | Port the process listens on (e.g. `5001` for auth). Many platforms set this automatically. |

Optional (depending on features):

- **Auth service:** `SMTP_*` (password reset emails), `GOOGLE_CLIENT_ID` (Google login), `CLOUDINARY_*` (profile pictures).
- **Story / Resource services:** `CLOUDINARY_*` for media uploads; otherwise local `uploads` may be used (ensure persistent storage on the host).

### Option 1: Deploy to Render

1. **MongoDB:** Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), get the connection URI, and add your Render IP (or `0.0.0.0/0` for testing) to the allow list.
2. **Render account:** Sign up at [Render](https://dashboard.render.com/).
3. **Create services:** For each backend service (auth, story, mentorship, resource, forum, event) and the API gateway:
   - **New → Web Service** (or Background Worker if applicable).
   - Connect your repo; set **Root Directory** to the service folder (e.g. `backend/services/auth-service` or `api-gateway`).
   - **Build:** `npm install` (or your Dockerfile if using Docker on Render).
   - **Start:** `npm start` (typically `node src/index.js` or similar).
   - Set **Environment Variables** (see table above). Use the same `MONGODB_URI` and `JWT_SECRET` for all.
4. **Gateway:** Deploy the API gateway as a Web Service. Set its environment so it can reach the other services via their **internal** or **public** URLs (depending on Render plan). Configure the gateway to proxy to each service URL (e.g. auth at `https://leadsher-auth.onrender.com`, story at `https://leadsher-story.onrender.com`).
5. **Base URL:** After deployment, the frontend should call the **gateway** URL (e.g. `https://leadsher-gateway.onrender.com`) so all `/api/*` routes are proxied to the correct service.

### Option 2: Deploy with Docker (VPS / single server)

1. **Server:** Provision a Linux VPS (e.g. Ubuntu) and install Docker and Docker Compose.
2. **Repo:** Clone this repo on the server (or copy files and `docker-compose.yml`).
3. **Environment:** Create `backend/.env` with production values:
   - `MONGODB_URI` — Atlas URI or a Mongo instance reachable from the server.
   - `JWT_SECRET` — strong secret.
4. **Run:** From the repo root:
   ```bash
   docker compose -f docker-compose.yml up -d --build
   ```
5. **Reverse proxy (recommended):** Put Nginx (or Caddy) in front of port `5000` and add TLS (e.g. Let's Encrypt). Expose only the gateway to the internet; keep other ports bound to `localhost` if possible.
6. **Persistence:** Use the existing Compose volumes for Mongo and uploads so data survives restarts.

### Option 3: Deploy services individually (Railway, Fly.io, Heroku)

- Deploy each service from its own directory (e.g. `backend/services/auth-service`, `backend/services/story-service`).
- Use the same `MONGODB_URI` and `JWT_SECRET` on every service.
- Deploy the API gateway and set its config to point to each service public URL.
- Ensure CORS and gateway proxy paths match your frontend API base URL.

### Post-deployment verification

- **Health checks:** Call each service health endpoint if available (e.g. `GET https://your-auth-service/health`, `GET https://your-story-service/health`). The gateway may expose a single `/health` that checks downstream services.
- **API:** Use the gateway base URL in the frontend (e.g. `https://your-gateway.example.com`). Test login (`POST /api/auth/login`), then a protected route (e.g. `GET /api/auth/profile` with `Authorization: Bearer <token>`), and story endpoints (e.g. `GET /api/stories/featured`).
- **CORS:** If the frontend is on a different origin, configure CORS on the gateway (or each service) to allow that origin.

### Summary

| Step | Action |
|------|--------|
| 1 | Create production MongoDB (e.g. Atlas) and get `MONGODB_URI`. |
| 2 | Choose a deployment option (Render, Docker on VPS, or per-service on Railway/Fly/Heroku). |
| 3 | Set `MONGODB_URI`, `JWT_SECRET`, and optional vars for every service. |
| 4 | Deploy the API gateway and point the frontend to its URL. |
| 5 | Verify health and API calls (auth and at least one other service, e.g. stories). |

For more detail on a specific platform, see that platform documentation (e.g. [Render Docs](https://render.com/docs), [Docker Docs](https://docs.docker.com/)).

---

## Scripts (backend workspace)

From `backend/`:

- `npm run up` — start stack with Docker Compose (build and run).
- `npm run down` — stop stack.
- `npm run logs` — follow Compose logs.

To work on a single service, `cd backend/services/<service-name>` and use `npm run dev` (or `npm start`) with MongoDB and `.env` configured.
