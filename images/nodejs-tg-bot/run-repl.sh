#!/bin/sh

docker run --rm -it --name repl --network host -v `pwd`/destination:/workdir node-repl:latest
