FROM node:20.5.1-alpine3.17

WORKDIR /app
ENV NODE_PATH="/app:/app/node_modules"

RUN npm install -g pnpm

ENTRYPOINT pnpm run start
