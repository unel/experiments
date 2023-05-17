example command

```bash
 docker run --rm -it --name mongo-1 -v /workdir/keyfiles/mongo:/keyfiles -p 27017:27017 -e MONGO_INITDB_DATABASE=data -e MONGO_INITDB_ROOT_USERNAME=adm -e MONGO_INITDB_ROOT_PASSWORD=pwd mongo --replSet replData --keyFile=/keyfiles/mongokey
```
