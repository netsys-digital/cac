FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
COPY apps/api/package.json apps/api/
COPY apps/www/package.json apps/www/
COPY apps/web/package.json apps/web/
RUN npm install
COPY . .

ARG VITE_API_URL=http://localhost:3003
ARG VITE_WEB_URL=http://localhost:5178
ARG VITE_WWW_URL=http://localhost:5179
ARG VITE_BASE=/
ARG VITE_APP_BRAND_NAME="AgriZone Connect"
ARG VITE_APP_BRAND_SHORT=AZC
ARG VITE_APP_BRAND_LOGO=""
ARG VITE_FONT_EXTRA_GRANDE=38px
ARG VITE_FONT_GRANDE=28px
ARG VITE_FONT_MEDIA=14px
ARG VITE_FONT_PEQUENA=12px
ARG VITE_FONT_MINI=10px
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WEB_URL=$VITE_WEB_URL
ENV VITE_WWW_URL=$VITE_WWW_URL
ENV VITE_BASE=$VITE_BASE
ENV VITE_APP_BRAND_NAME=$VITE_APP_BRAND_NAME
ENV VITE_APP_BRAND_SHORT=$VITE_APP_BRAND_SHORT
ENV VITE_APP_BRAND_LOGO=$VITE_APP_BRAND_LOGO
ENV VITE_FONT_EXTRA_GRANDE=$VITE_FONT_EXTRA_GRANDE
ENV VITE_FONT_GRANDE=$VITE_FONT_GRANDE
ENV VITE_FONT_MEDIA=$VITE_FONT_MEDIA
ENV VITE_FONT_PEQUENA=$VITE_FONT_PEQUENA
ENV VITE_FONT_MINI=$VITE_FONT_MINI

RUN npm run build -w @cac/shared && npm run build -w @cac/ui && npm run build -w @cac/web

FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
