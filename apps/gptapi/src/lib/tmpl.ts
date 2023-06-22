// here used this template engine: https://github.com/tbranyen/combyne

import combyne from 'combyne';
import md5 from 'js-md5';

combyne.settings.delimiters = {
	START_RAW: '{',
	END_RAW: '}',
};

const TEMPLATES = {};

const filters = [
	function uppercase(...elements) {
		console.log('uc', elements);
		return elements.map(element => String(element).toUpperCase());
	},
];

function registerTemplate(template) {
	const id = md5(template);

	if (!TEMPLATES[id]) {
		const combyneT = combyne(template);

		for (const filter of filters) {
			combyneT.registerFilter(filter.name, filter);
		}

		TEMPLATES[id] = data => combyneT.render(data);
	}

	return TEMPLATES[id];
}

export function renderTemplate(template, data) {
	return registerTemplate(template)(data);
}
