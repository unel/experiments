FROM node:20.1.0-alpine3.17

RUN mkdir /app
WORKDIR /app
COPY ./proj/destination/build ./
COPY ./proj/destination/node_modules ./node_modules

ENV NODE_PATH="/app:/app/node_modules"

ENTRYPOINT node ./my-server
