#!/bin/sh

echo "building app $1 image from folder $2" 
docker build -t $1 --build-arg APP_DIR=$2 -f /workdir/iduno/images/nodejs-app/Dockerfile /workdir/iduno/
