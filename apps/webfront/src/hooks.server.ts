import type { Handle } from '@sveltejs/kit';

import { JWT_ACCESS_SECRET } from '$env/static/private';
import jwt from 'jsonwebtoken';

import { db } from '$lib/db';

const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('AuthorizationToken');

	if (token) {
		try {
			const jwtUser = jwt.verify(token, JWT_ACCESS_SECRET);
			if (typeof jwtUser === 'string') {
				throw new Error('Something went wrong');
			}

			const user = await db.user.findUnique({
				where: {
					id: jwtUser.id
				}
			});

			if (!user) {
				throw new Error('User not found');
			}

			event.locals.user = { id: user.id };
		} catch (error) {
			console.error(error);
		}
	}

	return resolve(event);
};

export { handle };
