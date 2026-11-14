FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    DATA_DIR=/data

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .
RUN mkdir -p /data/auth && chown -R node:node /app /data

USER node
CMD ["npm", "start"]
