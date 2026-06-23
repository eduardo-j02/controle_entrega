const Fastify = require('fastify');
const swagger = require('@fastify/swagger');
const swaggerUI = require('@fastify/swagger-ui');

const app = Fastify();

app.register(swagger, {
  openapi: {
    info: {
      title: "Test API",
      version: "1.0.0"
    }
  }
});
app.register(swaggerUI, { routePrefix: '/docs' });

app.get('/ping', {
  schema: {
    description: 'Ping test',
    tags: ['Test'],
    response: {
      200: {
        type: 'object',
        properties: { pong: { type: 'string' } }
      }
    }
  }
}, async () => ({ pong: 'it works!' }));

app.listen({ port: 3333 });