FROM node:18.18.2-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.25.3-alpine
RUN chown -R nginx:nginx /usr/share/nginx/html && chown -R nginx:nginx /var/cache/nginx && chown -R nginx:nginx /var/log/nginx && chown -R nginx:nginx /etc/nginx/conf.d
COPY --from=builder /app/dist /usr/share/nginx/html
RUN chown -R nginx:nginx /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN chown nginx:nginx /etc/nginx/conf.d/default.conf
USER nginx
EXPOSE 80
