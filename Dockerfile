FROM node:20-slim
WORKDIR /app

# 1. Install dependencies
COPY package*.json ./
# We need devDeps because tsx is a devDependency
RUN npm install --legacy-peer-deps

# 2. Copy the rest of your code (including the src folder)
COPY . .

# 3. Create uploads directory
RUN mkdir -p uploads

# 4. Environment setup
ENV NODE_ENV=production
ENV PORT=5001
EXPOSE 5001

# 5. Start the server using tsx
# This matches your local 'npm run dev' behavior which we know works
CMD ["npx", "tsx", "src/server.ts"]