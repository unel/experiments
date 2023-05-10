# project builder

This image should be build some projects into target folder:
- mount dir source
- mount dir destination
- run `npm install -d`


to run building you should execure something like this:

```bash
docker run --rm -it -v `pwd`/source/:/workdir/source -v `pwd`/destination:/workdir/destination npm-builder:0.0.5
```
