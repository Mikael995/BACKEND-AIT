# Stage 1: Build (The "Kitchen")
FROM node:20-slim AS builder
WORKDIR /app

# Install all dependencies (including Vite/TS)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy code and build the React frontend
COPY . .
RUN npm run build 

# Stage 2: Production (The "Table")
FROM node:20-slim
WORKDIR /app

# 1. Copy only the essential built files and package info
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/tsconfig*.json ./

# 2. Install ONLY production dependencies (no Vite, no ESLint)
RUN npm install --omit=dev --legacy-peer-deps

# 3. Install tsx globally so we can run server.ts
RUN npm install -g tsx

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Start the server directly
CMD ["tsx", "src/server.ts"]