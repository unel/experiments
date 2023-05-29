# some experiments with hype technologies

This is a research project to combine docker, node, mongo, chatGPT, telegram bot and TTS / STT services

build node project
```bash
./images/nodejs-builder/build-project.sh ${APPS_DIR}/nodejs-tg-bot /workdir/experiments/destination/tmp1
```

run node repl on container:
```bash
./images/nodejs-repl/run-repl.sh /workdir/experiments/destination/tmp1/
```

build node app image with code:
```bash
./images/nodejs-app/build-app-image.sh tg ./destination/tmp1
```

build node + image:
```bash
./build.sh tg ${APPS_DIR}/tg/
./build.sh ai ${APPS_DIR}/openai/
```

run node builded app image:
```bash
docker run -it --rm --name tg-instance tg
docker run -it --rm -p 8000:8000 --name ai ai
docker run -d --name mongo-1 mongo
```

run docker db
```
docker run -d --name mongo-server -p 27017:27017 -v /workdir/backups/mongo:/data/backups/ -v ${KEYS_DIR}/mongo:/data/keyfiles/ -e MONGO_INITDB_ROOT_USERNAME= -e MONGO_INITDB_ROOT_PASSWORD= mongo --replSet rs0 --keyFile=/data/keyfiles/mongokey
```

run watching application
```
docker run --rm -it --name wf -v ${APPS_DIR}/webfront:/app -w /app --network=host --entrypoint="npm"  node:20.2.0-alpine3.17 run dev -- --host --port=80
```

some warmup:
```bash
openssl rand -base64 756 > ${KEYS_DIR}/mongo/mongokey
chmod 400 ${KEYS_DIR}/mongo/mongokey
chown 999:root ${KEYS_DIR}/mongo/mongokey

sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /workdir/keys/dispatcher/ssl/private/nginx-selfsigned.key -out /workdir/keys/dispatcher/ssl/certs/nginx-selfsigned.crt
sudo openssl dhparam -out /workdir/keys/dispatcher/dh/nginx-dhparam.pem 4096

docker compose up

docker exec experiments-mongo-server-1 mongosh -u ${MONGO_INITIAL_USERNAME} -p ${MONGO_INITIAL_PASSWORD} --port ${MONGO_PORT} --eval 'rs.initiate()'
docker exec experiments-webfront-1 npx prisma db seed
```
