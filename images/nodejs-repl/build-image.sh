#!/bin/sh

echo "building node-repl:$1"

docker build -t node-repl:latest -t node-repl:$1 .
