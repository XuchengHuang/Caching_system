const { getEmbeddingWithCache } = require('../services/embeddingService');

async function handleEmbeddingRequest(req, res) {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text' });
  }

  try {
    const result = await getEmbeddingWithCache(text);
    res.json(result);
  } catch (error) {
    console.error('[Controller Error]', error);
    const status = error.status || 500;
    const message = error.message || 'Internal Server Error';
    res.status(status).json({ error: message });
  }
}

module.exports = {
  handleEmbeddingRequest,
};
