# Render – Single Service (No Blueprint)

Runs the full LeadsHer backend (API gateway + auth, story, mentorship, resource services) in **one** Docker container so it fits Render’s free tier (1 web service).

## Build (local)

From the **repo root**:

```bash
docker build -f render-one/Dockerfile -t leadsher-render-one .
docker run -p 5000:5000 -e MONGODB_URI="mongodb://..." -e JWT_SECRET="your-secret" leadsher-render-one
```

## Deploy on Render (manual)

1. New → Web Service, connect repo.
2. **Root Directory:** (empty)
3. **Dockerfile Path:** `render-one/Dockerfile`
4. Add env: `MONGODB_URI`, `JWT_SECRET`
5. Deploy.

See [DEPLOYMENT.md](../DEPLOYMENT.md) → Option B for full steps.
