import { json } from '@sveltejs/kit';


export function GET() {
    return json({
        routes: [
            '/api/chat/v1/chats',
        ]
    });
}
