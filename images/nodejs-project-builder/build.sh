#!/bin/sh

cd /workdir/source

printf "\ninstalling all dependencies..\n\n"
npm install

printf "\nrunning build command..\n\n"
npm run ci:build

printf "\nclearing dependencies..\n\n"
rm -rf ./node_modules

printf "\ninstalling production depencencies..\n\n"
npm install --omit=dev

printf "\ncopying build files and dependencies..\n\n"
cp -r ./node_modules /wordkir/destination
cp -r ./build /workdir/destination

printf "\ncleanup..\n\n"
rm -rf ./build

printf "build successful! \n\n"
