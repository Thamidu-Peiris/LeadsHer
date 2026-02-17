# Render – Single Service (No Blueprint)

Runs the full LeadsHer backend (API gateway + auth, story, mentorship, resource services) in **one** Docker container so it fits Render’s free tier (1 web service).

## If you see "Cannot find module .../backend/index.js"

Render is using **Node** instead of **Docker**. You **cannot** change an existing service from Node to Docker in Settings. Create a **new** Web Service and choose Docker when creating it (see "Deploy on Render" below).

## Build (local)

From the **repo root**:

```bash
docker build -f render-one/Dockerfile -t leadsher-render-one .
docker run -p 5000:5000 -e MONGODB_URI="mongodb://..." -e JWT_SECRET="your-secret" leadsher-render-one
```

## Deploy on Render (manual)

1. **[Dashboard](https://dashboard.render.com)** → **New +** → **Web Service**.
2. Connect your Git provider and select the **LeadsHer** repo.
3. In the create form, set:
   - **Name:** e.g. `leadsher-api`
   - **Region:** choose one
   - **Branch:** your branch (e.g. `main`)
   - **Root Directory:** leave **empty**
   - **Runtime / Language:** choose **Docker** (in the dropdown: Node, Python, Docker, …)
   - **Dockerfile Path:** `render-one/Dockerfile`
4. **Instance type:** Free (or paid).
5. Click **Advanced** and add environment variables:
   - `MONGODB_URI` = your MongoDB Atlas URI
   - `JWT_SECRET` = your secret
6. Click **Create Web Service**. Render will build and deploy.

You cannot switch an existing Node service to Docker; you must create a new service with **Runtime: Docker**. See [DEPLOYMENT.md](../DEPLOYMENT.md) → Option B for more.
