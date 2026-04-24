import express from 'express';
import dotenv from 'dotenv';
import { parseBookingRequest } from './ollamaService.js';
dotenv.config();

const app = express();
app.use(express.json());

app.post('/api/ai-bookings', async (req, res) => {
  try {
    const { input, now, timezone } = req.body;
    if (!input || typeof input !== 'string') {
      return res.status(400).json({ error: 'Input is required' });
    }

    const result = await parseBookingRequest({ input, now, timezone });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 6000;
app.listen(PORT, () => console.log(`AI Service running on port ${PORT}`));
