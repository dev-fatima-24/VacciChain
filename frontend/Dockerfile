FROM node:18.18.2-alpine@sha256:18a70ffe45b8a3db9e3e8dd85a92d7beab70d395e0d529ada0d9de0319c8b4d7 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.25.3-alpine@sha256:41edf44158e0046487e614e118e9d1f0e0614a95a0c8f8e1ad826e8a9fb02a80
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
