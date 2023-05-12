#!/bin/sh

echo "running repl in '$1'"

docker run --rm -it --name repl --network host -v $1:/workdir node-repl:latest
