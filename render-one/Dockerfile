# LeadsHer – single container for Render (free tier: 1 service)
# Runs api-gateway (nginx) + auth, story, mentorship, resource services in one process.

FROM node:18-alpine

# Nginx and envsubst for gateway
RUN apk add --no-cache nginx gettext

WORKDIR /app

# --- Auth service ---
COPY backend/services/auth-service/package*.json ./services/auth-service/
RUN cd services/auth-service && npm install --production
COPY backend/services/auth-service ./services/auth-service

# --- Story service ---
COPY backend/services/story-service/package*.json ./services/story-service/
RUN cd services/story-service && npm install --production
COPY backend/services/story-service ./services/story-service
RUN mkdir -p services/story-service/uploads/stories

# --- Mentorship service ---
COPY backend/services/mentorship-service/package*.json ./services/mentorship-service/
RUN cd services/mentorship-service && npm install --production
COPY backend/services/mentorship-service ./services/mentorship-service

# --- Resource service ---
COPY backend/services/resource-service/package*.json ./services/resource-service/
RUN cd services/resource-service && npm install --production
COPY backend/services/resource-service ./services/resource-service
RUN mkdir -p services/resource-service/uploads/resources

# --- API Gateway (nginx config + start script) ---
COPY render-one/nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY render-one/start.sh /start.sh
RUN chmod +x /start.sh

# Render sets PORT for the web service (e.g. 10000)
EXPOSE 5000

CMD ["/start.sh"]
