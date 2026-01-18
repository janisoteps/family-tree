FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app

# Install Node 20 + pm2
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git \
    python3 make g++ \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && npm install -g pm2 \
  && rm -rf /var/lib/apt/lists/*

# Copy only package files first
COPY package.json package-lock.json ./

# Install deps and hard-fail if lbug didn't install
RUN npm ci \
 && node -e "require.resolve('lbug'); console.log('lbug installed OK')"

# Copy the rest
COPY . .

RUN mkdir -p /app/data

EXPOSE 3666
CMD ["pm2-runtime", "start", "npm", "--", "start"]
