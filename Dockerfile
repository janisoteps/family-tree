# Ubuntu 24.04 ships glibc 2.39 (>= 2.38), which fixes the lbug native addon error.
FROM node:20-bookworm-slim

WORKDIR /app

# Install pm2 for runtime process management (like you do on the VM)
RUN npm install -g pm2

# Copy package files first to leverage Docker layer caching
COPY package*.json ./

# Install deps (use npm ci if package-lock.json exists)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy the rest of the app
COPY . .

# Ensure data dir exists inside container (DB file will be mounted here)
RUN mkdir -p /app/data

# App listens on PORT from env; expose for documentation
EXPOSE 3666

# Run via PM2 in Docker mode
CMD ["pm2-runtime", "start", "npm", "--", "start"]
