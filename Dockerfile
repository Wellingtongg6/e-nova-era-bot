FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    DATA_DIR=/data

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .
RUN mkdir -p /data/auth && chown -R node:node /app /data

USER node
CMD ["npm", "start"]
