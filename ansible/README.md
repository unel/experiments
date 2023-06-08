required to configure ansible-hosts (inventory)

```yml
machines:
  hosts:
    dev_server:
      ansible_host: xxx.xxx.xxx.xxx
      projects_work_dir: /workdir
      ansible_python_interpreter: /usr/bin/python3
```

and fill 01-experiments-project/secrets directory with these files:

envs/root.env.template:
```
APPS_DIR={{ project_root }}/experiments/apps
KEYS_DIR={{ project_root }}/keyfiles
BACKUPS_DIR={{ project_root }}/backups
DATA_DIR={{ project_root }}/data

CHAT_API_NODE_PORT=10101
CHAT_API_BASEPATH=/api/chat

WEBFRONT_NODE_PORT=9999
WEBFRONT_DEV_NODE_PORT=6666
WEBFRONT_INITIAL_USERNAME=...
WEBFRONT_INITIAL_PASSWORD=...

MONGO_PORT=27017
MONGO_INITIAL_USERNAME=...
MONGO_INITIAL_PASSWORD=...

MONGO_ADMIN_PORT=8081
MONGO_ADMIN_BASEPATH=/admin/mongo

SITE_ORIGIN=https://{{ domain_name }}
```


envs/webfront.env:
```
DATABASE_URL="mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongo-server:${MONGO_PORT}/data?retryWrites=true&w=majority&authSource=admin"
JWT_ACCESS_SECRET="..."
```

envs/chatapi.env:
```
DATABASE_URL="mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongo-server:${MONGO_PORT}/chats?retryWrites=true&w=majority&authSource=admin"
```

key files for nginx: (see https://www.digitalocean.com/community/tutorials/how-to-create-a-self-signed-ssl-certificate-for-nginx-in-ubuntu-20-04-1)
- keyfiles/dispatcher-dhparam.pem --
- keyfiles/dispatcher-selfsigned.crt -- ssl certificate
- keyfiles/dispatcher-selfsigned.key -- ssl private key

```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout dispatcher-selfsigned.key -out dispatcher-selfsigned.crt
sudo openssl dhparam -out dispatcher-dhparam.pem 4096
```


- keyfiles/mongo-connection-config.yaml -- for pass connection string to mongo from config
```yml
uri: mongodb://root:pwd@localhost:7777
```

- keyfiles/mongo-key (you can generate by `openssl rand -base64 756 > mongokey`)
