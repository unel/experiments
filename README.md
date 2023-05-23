# some experiments with hype technologies

This is a research project to combine docker, node, mongo, chatGPT, telegram bot and TTS / STT services

build node project
```bash
./images/nodejs-builder/build-project.sh /workdir/iduno/apps/nodejs-tg-bot /workdir/iduno/destination/tmp1
```

run node repl on container:
```bash
./images/nodejs-repl/run-repl.sh /workdir/iduno/destination/tmp1/
```

build node app image with code:
```bash
./images/nodejs-app/build-app-image.sh tg ./destination/tmp1
```

build node + image:
```bash
./build.sh tg /workdir/iduno/apps/tg/
./build.sh ai /workdir/iduno/apps/openai/
```

run node builded app image:
```bash
docker run -it --rm --name tg-instance tg
docker run -it --rm -p 8000:8000 --name ai ai
docker run -d --name mongo-1 mongo
```

run docker db
```
docker run -d --name mongo-server -p 27017:27017 -v /workdir/backups/mongo:/data/backups/ -v /workdir/keyfiles/mongo:/data/keyfiles/ -e MONGO_INITDB_ROOT_USERNAME= -e MONGO_INITDB_ROOT_PASSWORD= mongo --replSet rs0 --keyFile=/data/keyfiles/mongokey
```

run watching application
```
docker run --rm -it --name wf -v /workdir/iduno/apps/webfront:/app -w /app --network=host --entrypoint="npm"  node:20.2.0-alpine3.17 run dev -- --host --port=80
```


run this all
```bash
docker compose up
```
