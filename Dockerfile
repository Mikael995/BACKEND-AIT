# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# This builds your React frontend
RUN npm run build 

# Stage 2: Production
FROM node:20-slim
WORKDIR /app

# Copy everything from builder (simplest for combined apps)
COPY --from=builder /app /app

# Install 'tsx' globally so we can run the .ts server file directly in production
RUN npm install -g tsx

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Run the server.ts file directly from the src folder
CMD ["tsx", "src/server.ts"]