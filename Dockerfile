# Build
FROM node:26-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
# Gabarit : l'entrypoint nginx remplit ${NGINX_LOCAL_RESOLVERS} (resolv.conf) et ${COTE_VITRINE_URL}.
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1 \
    COTE_VITRINE_URL=http://app-z935c5bd2-cote.z5b2bf3ce-cote.svc.cluster.local:3000/vitrine/yugioh/collection.csv
RUN rm -f /etc/nginx/conf.d/default.conf

# nginx:alpine already has nginx user (uid 101) — just fix permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx
EXPOSE 80

# wget is built into Alpine — no need to install curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
