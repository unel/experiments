export function strcmp(a: string, b: string): -1 | 0 | 1 {
	if (a < b) {
		return -1;
	}

	if (a > b) {
		return 1;
	}

	return 0;
}
