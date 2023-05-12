FROM node:20.1.0-alpine3.17

ARG APP_DIR

RUN mkdir /app
WORKDIR /app
COPY ${APP_DIR:-build} ./

ENV NODE_PATH="/app:/app/node_modules"

ENTRYPOINT node ./main.js
