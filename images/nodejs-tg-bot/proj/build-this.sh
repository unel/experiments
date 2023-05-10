#!/bin/sh

docker run --rm -it -v `pwd`/source/:/workdir/source -v `pwd`/destination:/workdir/destination npm-builder:0.0.5
