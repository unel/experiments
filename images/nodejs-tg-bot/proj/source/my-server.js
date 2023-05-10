const fastify = require('fastify');

const server = fastify({ logger: true });

server.route({
    method: 'GET',
    url: '/',

    handler: async (request, reply) => {
        return {
            hello: 'world'
        };
    }
})

server.listen({
    host: '0.0.0.0',
    port: 8000
});
