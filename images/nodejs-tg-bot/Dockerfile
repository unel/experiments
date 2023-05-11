FROM node:20.1.0-alpine3.17

RUN mkdir /app
WORKDIR /app
COPY ./destination ./

ENV NODE_PATH="/app:/app/node_modules"

ENTRYPOINT node ./run-server
