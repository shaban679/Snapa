const express = require('express');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// POST /ai/generate-caption — { idea: "safari, bahari" } -> { caption }
router.post('/generate-caption', requireAuth, async (req, res, next) => {
  try {
    const { idea } = req.body;
    if (!idea) return res.status(400).json({ error: 'idea inahitajika' });

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(501).json({ error: 'ANTHROPIC_API_KEY haijawekwa kwenye .env' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Andika caption fupi na ya kuvutia kwa Kiswahili ya post ya mitandao ya kijamii kuhusu: "${idea}". Ongeza mstari mmoja wa hashtags 3-5 zinazofaa. Toa tu caption na hashtags, bila maelezo mengine.`,
        }],
      }),
    });

    const data = await response.json();
    const text = data.content?.find(b => b.type === 'text')?.text || '';
    res.json({ caption: text.trim() });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
