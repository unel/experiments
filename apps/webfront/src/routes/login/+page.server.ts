import { fail, redirect, type RequestEvent, type Actions } from '@sveltejs/kit';
import { loginUser } from '$lib/user.model';

export const actions: Actions = {
    default: async (event: RequestEvent) => {
        const formData = Object.fromEntries(await event.request.formData());

        const { id, password } = formData;
        const { error, token } = await loginUser(id, password);

        if (error) {
            return fail(401, { error });
        }

        event.cookies.set('AuthorizationToken', `Bearer ${token}`, {
            httpOnly: true,
            path: '/',
            secure: true,
            sameSite: 'strict',
            maxAge: 60 * 60 * 24
        });

        throw redirect(302, '/profile');
    }
}
