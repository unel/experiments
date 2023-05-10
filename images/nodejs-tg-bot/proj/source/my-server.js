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
    port: 8000
});
