FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /app

# Node 20 + build deps + pm2
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git \
    python3 make g++ \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && npm install -g pm2 \
  && rm -rf /var/lib/apt/lists/*

# Copy only package.json first (so Docker cache works)
COPY package.json ./

RUN npm install --loglevel=verbose \
 && npm i lbug@^0.12.2 --loglevel=verbose \
 && node -e "console.log('lbug ->', require.resolve('lbug'))"

# Copy the rest of the app
COPY . .

RUN mkdir -p /app/data

EXPOSE 3666
CMD ["pm2-runtime", "start", "npm", "--", "start"]
