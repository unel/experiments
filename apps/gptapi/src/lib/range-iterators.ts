export function* makeRangeIterator({ from=0, to, step = 1 }) {
    for (let idx = from; idx <= to; idx += step) {
        yield idx;
    }
}
