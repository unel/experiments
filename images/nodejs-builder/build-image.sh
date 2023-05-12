#!/bin/sh

"building docker image with version $1"

docker build -t npm-builder:latest -t npm-builder:$1 .
