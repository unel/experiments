export function groupBy<T>(elements: Array<T>, keyFn: (element: T) => string): Record<string, T> {
	const result: Record<string, T> = {};

	for (const element of elements) {
		result[keyFn(element)] = element;
	}

	return result;
}

export function findById<ID = string, E extends Record<string, unknown> & { id: ID }>(
	elements: Array<E>,
	id: ID
): E | undefined {
	return elements.find((e) => e.id === id);
}

export function findIndexById<ID = string, E extends Record<string, unknown> & { id: ID }>(
	elements: Array<E>,
	id: ID
): number {
	return elements.findIndex((e) => e.id === id);
}
