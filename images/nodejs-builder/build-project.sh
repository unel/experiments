#!/bin/sh

echo "building project from '$1' into '$2'"

docker run --rm -it -v $1:/workdir/project -v $2:/workdir/destination npm-builder:latest
