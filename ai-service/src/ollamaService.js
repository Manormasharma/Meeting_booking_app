import axios from 'axios';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3:latest';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

/**
 * 🔥 STRONG PROMPT (forces JSON)
 */
const buildPrompt = ({ input, now, timezone }) => `
You are a machine that outputs ONLY JSON.

Do NOT write anything except JSON.
Do NOT explain anything.
Do NOT add text before or after JSON.

Output EXACTLY in this format:
{
  "people": 5,
  "start_time": "2026-04-26T15:00:00+05:30",
  "end_time": "2026-04-26T16:00:00+05:30"
}

Rules:
- Always return all 3 fields
- people must be a number
- start_time and end_time must be valid ISO strings
- Default people = 1
- Default duration = 60 minutes
- Use timezone: ${timezone}
- Current datetime: ${now}

User request:
${input}
`;

/**
 * 🔍 SAFE JSON EXTRACTION
 */
const extractJson = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Model returned empty response');
  }

  try {
    return JSON.parse(text);
  } catch {}

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error(`No JSON found in model response: ${text}`);
  }

  try {
    return JSON.parse(match[0]);
  } catch (err) {
    throw new Error(`Invalid JSON format: ${match[0]}`);
  }
};

/**
 * ✅ VALIDATION (safe + tolerant)
 */
const validateParsedBooking = (parsed) => {
  const people = Number(parsed.people) || 1;

  const start = new Date(parsed.start_time);
  const end = new Date(parsed.end_time);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    throw new Error('Invalid booking time returned by AI');
  }

  return {
    people,
    start_time: start.toISOString(),
    end_time: end.toISOString(),
  };
};

/**
 * 🚀 MAIN FUNCTION
 */
export async function parseBookingRequest({
  input,
  now = new Date().toISOString(),
  timezone = 'Asia/Kolkata',
}) {
  const prompt = buildPrompt({ input, now, timezone });

  // 🔥 Try Ollama first
  try {
    console.log("🔹 Calling Ollama...");

    const ollamaRes = await axios.post(OLLAMA_URL, {
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0,
      },
    });

    const raw = ollamaRes?.data?.response;

    console.log("🧠 OLLAMA RAW:", raw);

    if (!raw || !raw.includes('{')) {
      throw new Error("Ollama did not return JSON");
    }

    const parsed = extractJson(raw);
    return validateParsedBooking(parsed);

  } catch (err) {
    console.error("❌ OLLAMA FAILED:", err.message);
  }

  // 🔁 OpenAI fallback (optional)
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log("🔹 Falling back to OpenAI...");

      const chatgptRes = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: OPENAI_MODEL,
          response_format: { type: 'json_object' },
          temperature: 0,
          messages: [
            {
              role: 'system',
              content: 'You return only valid JSON for meeting booking extraction.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );

      const content = chatgptRes.data.choices[0].message.content;

      console.log("🧠 OPENAI RAW:", content);

      const parsed = extractJson(content);
      return validateParsedBooking(parsed);

    } catch (err) {
      console.error("❌ OPENAI FAILED:", err.message);
    }
  }

  // 🛟 FINAL FALLBACK (never crash system)
  console.warn("⚠️ USING FALLBACK BOOKING");

  const fallbackStart = new Date();
  const fallbackEnd = new Date(Date.now() + 60 * 60000);

  return {
    people: 1,
    start_time: fallbackStart.toISOString(),
    end_time: fallbackEnd.toISOString(),
  };
}