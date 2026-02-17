FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p uploads/stories

EXPOSE 5002

CMD ["node", "src/index.js"]
