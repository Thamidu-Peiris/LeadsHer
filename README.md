# LeadsHer

Single-repo project. Backend (Node/Express) lives in `backend/`.

## Component 1: User Management & Authentication

**Owner:** Member 1

### Quick start (one repo)

1. **Clone and go to backend**
   ```bash
   git clone <your-repo-url> LeadsHer
   cd LeadsHer/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment**
   - Copy `backend/.env.example` to `backend/.env`
   - Set `MONGODB_URI` (e.g. local MongoDB or Atlas) and `JWT_SECRET`

4. **Run**
   - Ensure MongoDB is running (local or Atlas).
   ```bash
   node index.js
   ```
   Server runs at `http://localhost:5000` (or `PORT` in `.env`).

### API endpoints (Auth)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register (name, email, password, optional role) | No |
| POST | `/api/auth/login` | Login (email, password) | No |
| GET | `/api/auth/profile` | Get current user profile | Bearer JWT |
| PUT | `/api/auth/profile` | Update profile (name, avatar, bio) | Bearer JWT |
| POST | `/api/auth/logout` | Logout (client should discard token) | Bearer JWT |
| POST | `/api/auth/forgot-password` | Request password reset (body: email) | No |
| POST | `/api/auth/reset-password` | Reset with token (body: token, newPassword) | No |

**Roles:** `Admin`, `Mentor`, `Mentee` (default: `Mentee`).

**Protected requests:** Send header: `Authorization: Bearer <jwt_token>`.

### Project structure (backend)

```
backend/
├── config/db.js       # MongoDB connection
├── controllers/       # authController.js
├── middleware/       # auth.js (JWT protect, role)
├── models/           # User.js
├── routes/           # auth.js
├── .env.example
├── index.js
└── package.json
```

### Adding more components

Keep one repo; add new route files (e.g. `routes/mentorship.js`) and mount them in `index.js` under `/api/...` as other team members build their components.
