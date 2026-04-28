FROM node:18.18.2-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18.18.2-alpine AS production
RUN addgroup -g 1001 -S appgroup && adduser -u 1001 -S appuser -G appgroup
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && chown -R appuser:appgroup /app
COPY --from=builder /app/node_modules/.bin /app/node_modules/.bin
COPY src ./src
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 4000
CMD ["node", "src/app.js"]
