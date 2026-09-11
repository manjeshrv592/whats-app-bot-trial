# Stage 1: build the admin dashboard as static files
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY admin-frontend/package*.json ./
RUN npm install
COPY admin-frontend/ ./
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: the backend, serving both the API and the built dashboard
FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/ .
COPY --from=frontend-builder /app/dist ./public

EXPOSE 3000

CMD ["node", "src/index.js"]
