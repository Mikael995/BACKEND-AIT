# Stage 1: Build (The "Kitchen")
FROM node:20-slim AS builder
WORKDIR /app

# Install all dependencies (including TypeScript compiler)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy code and compile TypeScript to JavaScript
COPY . .
RUN npm run build 

# Stage 2: Production (The "Table")
FROM node:20-slim
WORKDIR /app

# 1. Copy ONLY the compiled JavaScript from the builder
# Note: This matches "dist-server" from your tsconfig.json
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/package*.json ./

# 2. Install ONLY production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# 3. Create uploads directory for Multer (referenced in your server.ts)
RUN mkdir -p uploads

# 4. Environment setup
# Set this to 5001 to match your server.ts fallback
ENV NODE_ENV=production
ENV PORT=5001
EXPOSE 5001

# 5. Start the server using standard Node.js
# This is faster and more stable than using tsx in production
CMD ["node", "dist-server/server.js"]