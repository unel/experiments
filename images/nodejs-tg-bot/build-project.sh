#!/bin/sh

rm -rf ./destination/*

docker run --rm -it -v `pwd`:/workdir/project -v `pwd`/destination:/workdir/destination npm-builder:latest

sh build-image.sh
