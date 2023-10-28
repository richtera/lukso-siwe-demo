FROM node:18.17.1-slim as builder
RUN apt-get update \
  && apt-get install python3 make gcc g++ git -y \
  && npm i -g pnpm
WORKDIR /app
COPY package.json pnpm.lock /app/
RUN yarn install --frozen-lockfile
WORKDIR /run
COPY package.json yarn.lock /run/
RUN pnpm install --frozen-lockfile --production
COPY . /app/
WORKDIR /app
RUN pnpm run typechain && pnpm run build

FROM node:18.17.1-slim
ENV PORT=8080
ENV NODE_ENV=production
COPY --from=builder /app/dist.server /app
COPY --from=builder /run/node_modules /app/node_modules
COPY package.json yarn.lock /app/
COPY --from=builder /app/dist/ /app/web/
ENV BASE_DIR=/app/web
CMD ["node", "/app/worker.js"]