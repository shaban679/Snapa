const express = require('express');
const prisma = require('../prisma');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /messages/:userId — historia ya mazungumzo na mtumiaji fulani
router.get('/:userId', requireAuth, async (req, res, next) => {
  try {
    const otherId = req.params.userId;
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.userId, receiverId: otherId },
          { senderId: otherId, receiverId: req.userId },
        ],
      },
      orderBy: { sentAt: 'asc' },
      take: 100,
    });
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// GET /messages — orodha ya mazungumzo (mtu wa mwisho kuongea naye)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: req.userId }, { receiverId: req.userId }] },
      orderBy: { sentAt: 'desc' },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    // Punguza kuwa mazungumzo ya kipekee kwa kila mtu
    const seen = new Map();
    for (const m of messages) {
      const other = m.senderId === req.userId ? m.receiver : m.sender;
      if (!seen.has(other.id)) seen.set(other.id, { user: other, lastMessage: m });
    }
    res.json(Array.from(seen.values()));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
