// index.js
const express = require('express');
const redisClient = require('./configs/redis');
const embeddingRouter = require('./routes/embedding');
const metricsRouter = require('./routes/metrics');

const app = express();
app.use(express.json());
app.use('/embedding', embeddingRouter);
app.use('/metrics', metricsRouter);

app.get('/', async (req, res) => {
  if (!redisClient.isOpen) await redisClient.connect();

  await redisClient.set('greeting', 'Hello from Redis!');
  const message = await redisClient.get('greeting');
  res.send(message);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
