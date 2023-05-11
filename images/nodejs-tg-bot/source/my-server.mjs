import fastify from 'fastify';


export function makeServer({ logger = false }) {
    const server = fastify({ logger });

    server.route({
        method: 'GET',
        url: '/',

        handler: async (request, apply) => {
            return {
                hello: 'world'
            };
        },
    });

    return server;
}

export function makeAndRunServer({ host = 'localhost', port, logger = false }) {
    const server = makeServer({ logger });

    server.listen({ host, port });

    return server;
}
