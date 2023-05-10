# node repl

This image should be build some projects into target folder:
- mount dir code
- run node repl with loaded code


to run building you should execure something like this:

```bash
docker run --rm -it -v `pwd`/code/:/workdir/code node-repl:0.0.0
```
