import axios from 'axios';

export async function parseBookingRequest(input) {
  // Try Ollama first
  try {
    const ollamaRes = await axios.post('http://ollama:11434/api/generate', {
      prompt: `Extract booking info as JSON: ${input}`
    });
    if (ollamaRes.data && ollamaRes.data.response) {
      return JSON.parse(ollamaRes.data.response);
    }
  } catch (err) {
    // fallback to ChatGPT
  }
  // Fallback to ChatGPT
  try {
    const chatgptRes = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Extract booking info as JSON: ${input}` }]
    }, {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
    });
    const content = chatgptRes.data.choices[0].message.content;
    return JSON.parse(content);
  } catch (err) {
    throw new Error('AI parsing failed');
  }
}
