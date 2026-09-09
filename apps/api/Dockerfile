FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
COPY apps/api/package.json apps/api/
COPY apps/www/package.json apps/www/
COPY apps/web/package.json apps/web/
RUN npm install

FROM deps AS build
COPY . .
RUN npm run build -w @cac/shared && npm run db:generate -w @cac/api && npm run build -w @cac/api

FROM node:22-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY --from=build /app /app
WORKDIR /app/apps/api
RUN chmod +x /app/apps/api/docker-entrypoint.sh
EXPOSE 3003
ENTRYPOINT ["/app/apps/api/docker-entrypoint.sh"]
