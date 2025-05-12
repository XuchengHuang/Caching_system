// config/redis.js
const redis = require('redis');

const client = redis.createClient();

client.on('error', err => console.error('Redis error:', err));

(async () => {
  await client.connect();
  console.log('Redis connected');
})();

module.exports = client;


