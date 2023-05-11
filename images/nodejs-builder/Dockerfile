FROM node:20.1.0-alpine3.17

RUN mkdir -p /workdir
WORKDIR /workdir
COPY ./build.sh ./

ENTRYPOINT sh build.sh
