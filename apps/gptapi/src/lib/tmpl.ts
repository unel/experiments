// here used this template engine: https://github.com/tbranyen/combyne

import combyne from 'combyne';
import md5 from 'js-md5';

combyne.settings.delimiters = {
	START_RAW: '{{',
	END_RAW: '}}',

	START_PROP: '{{{',
	END_PROP: '}}}',
};

const TEMPLATES = {};

const filters = [
	function uppercase(...elements) {
		console.log('uc', elements);
		return elements.map(element => String(element).toUpperCase());
	},
];

function registerFilters(combyneT, filters) {
	for (const filter of filters) {
		combyneT.registerFilter(filter.name, filter);
	}
}

function registerTemplate(template) {
	const id = md5(template);

	if (!TEMPLATES[id]) {
		const combyneT = combyne(template);
		registerFilters(combyneT, filters);

		TEMPLATES[id] = data => {
			console.log('call template', template, data);

			const result = String(combyneT.render(data));

			console.log('template result', result);

			return result;
		};
	}

	return TEMPLATES[id];
}

export function renderTemplate(template, data) {
	return registerTemplate(template)(data);
}
