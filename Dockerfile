# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./

# ADD THE FLAG HERE TO FIX THE ERROR
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build 

# Stage 2: Production
FROM node:20-slim
WORKDIR /app

# Copy everything from builder
COPY --from=builder /app /app

RUN npm install -g tsx

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["tsx", "src/server.ts"]