let totalRequests = 0;
let redisHits = 0;
let dbReuseHits = 0;
let newModelInferences = 0;

function incrementTotal() {
  totalRequests++;
}

function incrementRedis() {
  redisHits++;
}

function incrementDb() {
  dbReuseHits++;
}

function incrementModel() {
  newModelInferences++;
}

function getMetrics() {
  const reuse_rate = totalRequests === 0
    ? 0
    : (redisHits + dbReuseHits) / totalRequests;

  return {
    total_requests: totalRequests,
    redis_hits: redisHits,
    db_reuse_hits: dbReuseHits,
    new_model_inferences: newModelInferences,
    reuse_rate: reuse_rate.toFixed(2),
  };
}

module.exports = {
  incrementTotal,
  incrementRedis,
  incrementDb,
  incrementModel,
  getMetrics,
};
