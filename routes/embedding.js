const express = require('express');
const router = express.Router();
const { handleEmbeddingRequest } = require('../controllers/embeddingController');

// POST /embedding
router.post('/', handleEmbeddingRequest);

module.exports = router;