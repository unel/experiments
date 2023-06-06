export function filterFields<T>(source: Record<string, T>, filter: (name: string, value: T) => boolean): Record<string, T> | null {
    const filteredEntries = Object.entries(source).flatMap(
        ([fieldName, value]) => {
            return filter(fieldName, value) ? [[fieldName, value]] : [];
        }
    );

    return filteredEntries.length
        ? Object.fromEntries(filteredEntries)
        : null;
}


export function pickFields<T>(source: Record<string, T>, fieldNames: Array<string>) {
    const namesSet = new Set(fieldNames);

    return filterFields(source, (fieldName:string) => namesSet.has(fieldName));
}
