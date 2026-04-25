FROM node:18.18.2-alpine@sha256:18a70ffe45b8a3db9e3e8dd85a92d7beab70d395e0d529ada0d9de0319c8b4d7 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18.18.2-alpine@sha256:18a70ffe45b8a3db9e3e8dd85a92d7beab70d395e0d529ada0d9de0319c8b4d7 AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/node_modules/.bin /app/node_modules/.bin
COPY src ./src
EXPOSE 4000
CMD ["node", "src/app.js"]
