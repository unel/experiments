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

.env files you need:

/.env:
```env
APPS_DIR=/workdir/experiments/apps
KEYS_DIR=/workdir/keyfiles
BACKUPS_DIR=/workdir/backups
DATA_DIR=/workdir/data

NODE_PORT=9999

MONGO_PORT=7777
MONGO_INITIAL_USERNAME=some_user_for_mongo_admin
MONGO_INITIAL_PASSWORD=some_password_for_mongo_admin

MONGO_ADMIN_PORT=8081
MONGO_ADMIN_BASEPATH=/admin/mongo

SYSTEM_INITIAL_USERNAME=some_user_id_for_site
SYSTEM_INITIAL_PASSWORD=some_user_password_for_site
```

${APPS_DIR}/tg/.env:
```env
TG_BOT_TOKEN=token for bot # (see https://t.me/BotFather)
TG_BOT_AUTHOR=...

```

${APPS_DIR}/webfront/.env:
```env
DATABASE_URL="mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongo-server:${MONGO_PORT}/data?retryWrites=true&w=majority&authSource=admin"
JWT_ACCESS_SECRET=some_jwt_secret
```

${APPS_DIR}/openai/.env:
```
SERVER_PORT=8000
SERVER_HOST=0.0.0.0
SERVER_LOG=1

# see https://platform.openai.com/account/api-keys
OPENAI_API_ORGID=openaiorg_id
OPENAI_API_KEY=sk-openaikey
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
docker exec experiments-mongo-server-1 mongosh -u ${MONGO_INITIAL_USERNAME} -p ${MONGO_INITIAL_PASSWORD} --port ${MONGO_PORT} --eval 'db.getMongo().setReadPref("primaryPreferred")'
docker exec experiments-webfront-1 npx prisma db seed
```

backup / restore:
(!) insecure variants (!) :: password in command -> password in ps output & history -> pasword can be leaked

```bash
docker exec experiments-mongo-server-1 mongodump --port ${MONGO_PORT} -u ${MONGO_INITIAL_USERNAME} -p {MONGO_INITIAL_PASSWORD} --archive > /workdir/backups/mongo/mongodump.archive

docker exec -i experiments-mongo-server-1 mongorestore -verbose --port ${MONGO_PORT} -u ${MONGO_INITIAL_USERNAME} -p {MONGO_INITIAL_PASSWORD} --archive < /workdir/backups/mongo/mongodump.archive
```


more secure variants:
```bash
docker exec experiments-mongo-server-1 mongodump --config /data/keyfiles/config.yaml --archive > /workdir/backups/mongo/mongodump.archive
docker exec -i experiments-mongo-server-1 mongorestore --verbose --config /data/keyfiles/config.yaml --archive < /workdir/backups/mongo/mongodump.archive
```

in this case, in container should be exists `config.yaml` with this content (replace variables to concrete values):
```yaml
uri: mongodb://${MONGO_INITIAL_USERNAME}:${MONGO_INITIAL_PASSWORD}@localhost:${MONGO_PORT}
```


install nodeapps deps:

```bash
docker compose -f ./docker-compose-preinstall.yml up && docker compose -f ./docker-compose-preinstall.yml rm -f
```
