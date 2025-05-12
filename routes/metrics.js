const express = require('express');
const router = express.Router();
const metrics = require('../services/metricsService');

router.get('/', (req, res) => {
  res.json(metrics.getMetrics());
});

module.exports = router;