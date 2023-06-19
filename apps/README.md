create nodeap-sveltekit

```bash
APP_NAME=newapp docker run --rm -it -v ./:/apps -w /apps -e APP_NAME=$APP_NAME node:20.2.0-alpine3.17 npm create svelte@latest $APP_NAME
```


open app dir
```
APP_NAME=newapp docker run --rm -it -v ./$APP_NAME:/app -w /app -e APP_NAME=$APP_NAME node:20.2.0-alpine3.17 sh
```
