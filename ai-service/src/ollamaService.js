import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const buildPrompt = ({ input, now, timezone }) => `
You extract meeting room booking details from natural language.
Current datetime: ${now}
Timezone: ${timezone}

Return only valid JSON with this exact shape:
{
  "people": number,
  "start_time": "ISO-8601 datetime string",
  "end_time": "ISO-8601 datetime string"
}

Rules:
- Resolve relative dates like tomorrow using the current datetime and timezone.
- If duration is missing, use 60 minutes.
- If attendee count is missing, use 1.
- Do not include Markdown, explanations, comments, or extra fields.

Request: ${input}
`;

const extractJson = (value) => {
  if (!value || typeof value !== 'string') {
    throw new Error('Model returned an empty response');
  }

  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] || trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model response did not contain a JSON object');
  }

  return JSON.parse(candidate.slice(start, end + 1));
};

const validateParsedBooking = (parsed) => {
  const people = Number(parsed.people);
  const start = new Date(parsed.start_time);
  const end = new Date(parsed.end_time);

  if (!Number.isInteger(people) || people < 1) {
    throw new Error('Parsed people must be a positive integer');
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    throw new Error('Parsed booking times are invalid');
  }

  return {
    people,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
  };
};

export async function parseBookingRequest({ input, now = new Date().toISOString(), timezone = 'Asia/Kolkata' }) {
  const prompt = buildPrompt({ input, now, timezone });

  try {
    const ollamaRes = await axios.post(OLLAMA_URL, {
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: {
        temperature: 0,
      },
    });

    if (ollamaRes.data && ollamaRes.data.response) {
      return validateParsedBooking(extractJson(ollamaRes.data.response));
    }
  } catch {
    // Fall through to OpenAI fallback.
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('AI parsing failed and OPENAI_API_KEY is not configured');
  }

  try {
    const chatgptRes = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: OPENAI_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0,
      messages: [
        { role: 'system', content: 'You return only valid JSON for meeting booking extraction.' },
        { role: 'user', content: prompt },
      ],
    }, {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    });

    const content = chatgptRes.data.choices[0].message.content;
    return validateParsedBooking(extractJson(content));
  } catch (err) {
    throw new Error(`AI parsing failed: ${err.message}`);
  }
}
