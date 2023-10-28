FROM node:18.17.1-slim as builder
RUN apt-get update \
  && apt-get install python3 make gcc g++ git -y \
  && npm i -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml /app/
RUN pnpm install --frozen-lockfile
WORKDIR /run
COPY package.json pnpm-lock.yaml /run/
RUN pnpm install --frozen-lockfile --prod --shamefully-hoist
COPY . /app/
WORKDIR /app
ARG VITE_WALLET_CONNECT_PROJECT_ID
ARG VITE_APP_DOMAIN=example.com
ENV VITE_WALLET_CONNECT_PROJECT_ID=$VITE_WALLET_CONNECT_PROJECT_ID
ENV VITE_APP_DOMAIN=$VITE_APP_DOMAIN
RUN pnpm run typechain && pnpm run build

FROM node:18.17.1-slim
ENV PORT=8080
ENV NODE_ENV=production
COPY --from=builder /app/dist.server /app
COPY --from=builder /run/node_modules /app/node_modules
COPY package.json pnpm-lock.yaml /app/
COPY --from=builder /app/dist/ /app/web/
ENV BASE_DIR=/app/web
ENV VITE_MNEMONIC=""
CMD ["node", "/app/server/index.js"]