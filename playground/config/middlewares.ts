export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::compression',
  {
    name: 'strapi::cors',
    config: {
      origin: ['http://localhost:4201', 'http://localhost:4100', 'https://someotherwebsite.org'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
