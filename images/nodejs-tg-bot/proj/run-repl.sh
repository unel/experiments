#!/bin/sh

docker run --rm -it --network host -v `pwd`/destination:/workdir/code node-repl:0.0.7
