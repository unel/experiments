#!/bin/sh

echo "build app and make image $1 from folder $2"
mkdir -p "/workdir/iduno/destination/$1"
./images/nodejs-builder/build-project.sh $2 "/workdir/iduno/destination/$1"
./images/nodejs-app/build-app-image.sh $1 "./destination/$1"
