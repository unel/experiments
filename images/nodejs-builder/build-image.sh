#!/bin/sh

docker build -t npm-builder:latest -t npm-builder:$IMAGE_VERSION .
