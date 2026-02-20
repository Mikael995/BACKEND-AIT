FROM node:20-slim
WORKDIR /app

# 1. Install EVERYTHING (including devDeps like tsx)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# 2. Copy the source code
COPY . .

# 3. Create uploads directory
RUN mkdir -p uploads

# 4. Environment setup
ENV NODE_ENV=production
ENV PORT=5001
EXPOSE 5001

# 5. The Start Command
# Using 'npx' ensures it finds tsx in the node_modules
CMD ["npx", "tsx", "src/server.ts"]