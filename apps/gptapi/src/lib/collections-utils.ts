import md5 from 'js-md5';

import { strcmp } from '$lib/str-utils';
import { makeKeysIterator, makeTreeIterator, makeSliceIterator } from '$lib/collections-iterators';

export function isObject(value: unknown): boolean {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return (
		(prototype === null ||
			prototype === Object.prototype ||
			Object.getPrototypeOf(prototype) === null) &&
		!(Symbol.toStringTag in value) &&
		!(Symbol.iterator in value)
	);
}

export function isArray(value: unknown): boolean {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	return Array.isArray(value);
}

export function flatten(obj) {
	let elements = [];

	for (const { fullValuePath, value } of makeTreeIterator(obj)) {
		elements.push([fullValuePath, value]);
	}

	return elements;
}

export function setByPath(obj, path, value) {
	let target = obj;

	if (path.length < 1) {
		return;
	}

	for (const [pathKey, nextKey] of makeSliceIterator(path, 2)) {
		if (nextKey === undefined) {
			target[pathKey] = value;
			return;
		}

		if (!Object.hasOwnProperty.call(target, pathKey)) {
			target[pathKey] = typeof nextKey === 'string' ? {} : [];
		}

		target = target[pathKey];
	}
}

export function mergeObjects(objects = []) {
	const target = {};

	for (const obj of objects) {
		for (const { fullValuePath, value } of makeTreeIterator(obj)) {
			setByPath(target, fullValuePath, value);
		}
	}

	return target;
}

export function recMap(obj, mapFn = ({ parentKey, value }) => ({})) {
	const clone = obj.constructor();

	for (const iterData of makeTreeIterator(obj)) {
		const { value, parentObj, fullParentPath, parentKey } = iterData;

		const { parentKey: newKey = parentKey, value: newValue = value } = mapFn(iterData);

		setByPath(clone, fullParentPath.concat(newKey), newValue);
	}

	return clone;
}

function stringifyPath(path = [], { pathDelimiter = '.' } = {}) {
	return path.join(pathDelimiter);
}

function normaliseValue(value, { ignoreCase = false } = {}) {
	let result = value;

	if (typeof value === 'string') {
		result = result.trim();

		if (ignoreCase) {
			result = result.toLowerCase();
		}
	}

	return result;
}

export function hash(item, options = {}): string {
	const { kvDelimiter = ' :: ', elDelimiter = ', ' } = options;
	const elements = flatten(item).map(([path, value]) => {
		return [stringifyPath(path, options), normaliseValue(value, options)].join(kvDelimiter);
	});

	elements.sort((a, b) => strcmp(a, b));

	const rawHash = elements.join(elDelimiter);

	return md5(rawHash);
}
