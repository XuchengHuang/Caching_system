require('dotenv').config();
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// similarity for 2 vectors
function cosineSimilarity(vec1, vec2) {
  const dot = vec1.reduce((sum, v, i) => sum + v * vec2[i], 0);
  const norm1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
  const norm2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0));
  return dot / (norm1 * norm2);
}

// find similar embedding, mark as 'hit_or_not = 1' when a match is found
async function findSimilarEmbedding(targetEmbedding, threshold = 0.8) {
  const [rows] = await db.query(
    'SELECT id, question, answer, embedding FROM qa_pairs'
  );

  for (const row of rows) {
    const storedEmbedding = JSON.parse(row.embedding);
    const similarity = cosineSimilarity(targetEmbedding, storedEmbedding);

    if (similarity >= threshold) {
      // Mark as hit when matched
      await db.query('UPDATE qa_pairs SET hit_or_not = 1 WHERE id = ?', [
        row.id,
      ]);

      return {
        question: row.question,
        answer: row.answer,
        similarity,
      };
    }
  }

  return null;
}

module.exports = {
  findSimilarEmbedding,
  db,
};
