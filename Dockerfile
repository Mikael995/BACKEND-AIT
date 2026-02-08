# Stage 1: Build the frontend and backend
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y python3 make g++ 

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build both React (dist) and Express (dist-server)
RUN npm run build

# Stage 2: Run the server
FROM node:20-slim

WORKDIR /app

# Only copy necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Set environment to production
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["npm", "start"]