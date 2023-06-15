export function groupBy<T>(elements: Array<T>, keyFn: (element: T) => string): Record<string, T> {
    const result: Record<string, T> = {};

    for (const element of elements) {
        result[keyFn(element)] = element;
    }

    return result;
}
