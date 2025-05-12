const crypto = require('crypto');
const redisClient = require('../configs/redis');
const OpenAI = require('openai');
const { findSimilarEmbedding, db } = require('./dbSearchService');
const { askQuestionToOpenAI } = require('./qaService');
const metrics = require('../services/metricsService');


// In this code, due to OpenAI API rate limits, test code is used during runtime.
// A randomly generated float array is used to simulate the 'text-embedding-3-small' model.
// Additionally, a unified mock answer is returned to simulate OpenAI's new model response.
// In production, please comment out all code marked with 🧪 and enable the code marked with ✅.

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create a unique key based on the user's input hash
function hashInput(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Use a random number generator to simulate a call to ‘text-embedding-3-small’
function generateFakeEmbedding(dim = 1536) {
  return Array.from({ length: dim }, () => Math.random());
}

function makeSimilarEmbedding(base, targetSimilarity = 0.9) {
  const noiseFactor = Math.sqrt(1 - targetSimilarity ** 2);
  return base.map(v => v * targetSimilarity + (Math.random() - 0.5) * noiseFactor);
}

async function getEmbeddingWithCache(text) {
  metrics.incrementTotal(); // Count total requests
  const key = `embedding:${hashInput(text)}`;

  // Step1: Check if the question exists in Redis
  const cached = await redisClient.get(key);
  if (cached) {
    metrics.incrementRedis();
    const parsed = JSON.parse(cached);
    return {
      source: 'cache',
      question: parsed.question,
      answer: parsed.answer,
    };
  }

  // Step2: Call OpenAI to get the embedding
  // // ✅ This is the real implementation for using 'text-embedding-3-small' model from OpenAI to transform text to vector
  // try {
  //   const embeddingResponse = await openai.embeddings.create({
  //     model: 'text-embedding-3-small',
  //     input: text,
  //   });
  //   const embedding = embeddingResponse.data[0].embedding;
  // } catch (err) {
  //   if (err.status === 429) {
  //     throw {
  //       status: 429,
  //       message: 'OpenAI API quota exceeded',
  //     };
  //   }
  //   throw {
  //     status: 500,
  //     message: 'Failed to fetch embedding from OpenAI',
  //   };
  // }

  // 🧪
  // Randomly generate a vector with the same length as the 'text-embedding-3-small' model for a new question
  // Used to test the search function in MySQL. There are 2 specific questions and 1 answer for testing:
  // Q(a): Why choosing Moccet to execute your project is 10 times faster and 60% cheaper than traditional outsourcing?
  // Q(b): How does Moccet manage to ensure a higher quality of delivery than traditional outsourcing while costing less?
  // Answer: Moccet is the only platform that seamlessly blends AI agents with human expertise to execute your projects—10x faster, 60% cheaper, and with quality that exceeds traditional outsourcing.
  // Q(a) is stored in the MySQL database; Q(b) is used for testing and is designed to have a similar embedding vector to Q(a)
  const questionA =
  "Why choosing Moccet to execute your project is 10 times faster and 60% cheaper than traditional outsourcing?";
  const testCaseB =
    text ===
    "How does Moccet manage to ensure a higher quality of delivery than traditional outsourcing while costing less?";

  let embedding;

  if (testCaseB) {
    try {
      const [rows] = await db.query(
        "SELECT embedding FROM qa_pairs WHERE question = ? LIMIT 1",
        [questionA]
      );

      if (!rows.length) {
        throw new Error("Question A not found in database");
      }

      let baseEmbeddingRaw = rows[0].embedding;
      let baseEmbedding;

      try {
        if (typeof baseEmbeddingRaw === 'string') {
          baseEmbedding = JSON.parse(baseEmbeddingRaw);
        } else {
          baseEmbedding = baseEmbeddingRaw;
        }
        if (!Array.isArray(baseEmbedding)) {
          throw new Error('Parsed embedding is not an array');
        }
      } catch (e) {
        console.error('Failed to parse embedding from DB:', e.message);
        throw new Error('Failed to simulate embedding for test case B');
      }

      embedding = makeSimilarEmbedding(baseEmbedding, 0.9);
      console.log("Generated embedding with ~90% similarity to Question A from DB");
    } catch (err) {
      console.error("Failed to fetch or parse embedding from DB:", err.message);
      throw new Error("Failed to simulate embedding for test case B");
    }
  } else {
    embedding = generateFakeEmbedding();
  }

  // Step3: Check the database for similar questions
  const similar = await findSimilarEmbedding(embedding);
  if (similar) {
    metrics.incrementDb();

    await redisClient.set(
      key,
      JSON.stringify({ question: similar.question, answer: similar.answer })
    );

    return {
      source: 'mysql',
      question: similar.question,
      answer: similar.answer,
      similarity: similar.similarity,
    };
  }

  // Step4: If not found in Redis or MySQL, call ChatGPT for an answer
  // ✅
  // let answer;
  // try {
  //   answer = await askQuestionToOpenAI(text);
  //   metrics.incrementModel();
  // } catch (err) {
  //   return {
  //     source: 'openai',
  //     error: err.message, // Rate limit or error message
  //   };
  // }

  // 🧪 Simulated answer (comment this out when using OpenAI API in production)
  const answer = 'This is a simulation answer used to simulate OpenAI API calls. For actual testing, please comment out the code with the mock answer and use the real OpenAI call code that was commented out.';
  metrics.incrementModel(); // Count usage of OpenAI (mock in this case)

  // Step5: Store in the database
  await db.query(
    'INSERT INTO qa_pairs (question, answer, embedding) VALUES (?, ?, ?)',
    [text, answer, JSON.stringify(embedding)]
  );

  // Step6: Store in Redis cache
  await redisClient.set(key, JSON.stringify({ question: text, answer }));

  // ✅
  // return {
  //   source: 'openai',
  //   question: text,
  //   answer,
  // };

  // 🧪
  return {
    source: 'mock - openai',
    question: text,
    answer,
  };
}

module.exports = {
  getEmbeddingWithCache,
};
