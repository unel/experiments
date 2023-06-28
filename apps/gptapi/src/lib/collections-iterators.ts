import { isObject, isArray } from '$lib/collections-utils';
import { makeRangeIterator } from '$lib/range-iterators';

export function* makeKeysIterator(obj) {
	if (isObject(obj)) {
		yield* Object.keys(obj);
	}

	if (isArray(obj)) {
		yield* makeRangeIterator({ to: obj.length - 1 });
	}
}

export function* makeByIterator(list, groupSize) {
	const slice = list.slice();

	while (slice.length) {
		yield slice.splice(0, groupSize);
	}
}

export function* makeSliceIterator(list, sliceSize) {
	for (let idx = 0; idx < list.length; idx++) {
		yield list.slice(idx, idx + sliceSize);
	}
}

export function* makeTreeIterator(rootObj, parentObj = rootObj, fullParentPath = []) {
	for (const parentKey of makeKeysIterator(parentObj)) {
		const fullValuePath = fullParentPath.concat([parentKey]);
		const value = parentObj[parentKey];

		if ((isObject(value) || isArray(value)) && Object.keys(value).length) {
			yield* makeTreeIterator(rootObj, value, fullValuePath);
		} else {
			yield {
				rootObj,
				parentObj,
				fullParentPath,
				fullValuePath,
				parentKey,
				value,
			};
		}
	}
}
