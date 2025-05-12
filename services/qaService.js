require('dotenv').config();

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


async function askQuestionToOpenAI(question) {
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a question helper.' },
        { role: 'user', content: question },
      ],
    });

    return response.data.choices[0].message.content;

  } catch (error) {
    console.error('[OpenAI ERROR]', error.message);

    // Check if the error is due to rate limiting
    if (error.response && error.response.status === 429) {
      throw new Error('OpenAI API flow is limited');
    }

    // Other errors
    throw new Error('OpenAI API request failed!');
  }
}

module.exports = { askQuestionToOpenAI };
