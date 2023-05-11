#!/bin/sh

cd /workdir/project

npm run ci:build

printf "\ncopying build files and dependencies..\n\n"
cp -r ./node_modules /workdir/destination/
cp -r ./build/* /workdir/destination/
cp -r .env /workdir/destination/

printf "\ncleanup..\n\n"
npm run ci:clean

printf "build successful! \n\n"
