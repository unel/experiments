import md5 from 'js-md5';

import { strcmp } from '$lib/str-utils';

export function flatten(item, path = []) {
    let elements = [];

    for (const key of Object.keys(item)) {
        const elementPath = path.concat(key);
        const element = item[key];

        if (typeof element !== 'object' || element === null) {
            elements.push([elementPath, element]);
        } else {
            elements = elements.concat(flatten(element, elementPath));
        }
    }

    return elements;
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
    const { kvDelimiter = ' :: ', elDelimiter = ', '} = options;
    const elements = flatten(item).map(([path, value]) => {
        return [stringifyPath(path, options), normaliseValue(value, options)].join(kvDelimiter);
    });

    elements.sort((a, b) => strcmp(a, b));

    const rawHash = elements.join(elDelimiter);

    return md5(rawHash);
}
