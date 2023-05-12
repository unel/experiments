# project builder

This image should be build some projects into target folder:
- mount dir source
- mount dir destination
- run `npm install -d`


to run building you should execure something like this:

```bash
docker run --rm -it -v `pwd`/source/:/workdir/source -v `pwd`/destination:/workdir/destination npm-builder:0.0.5
```


`build-image.sh` - script to build docker image with builder
`build.sh` - script for building node projects (will be run in builder container)
`build-project.sh` - script for run builder container to build nodejs project
