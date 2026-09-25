const express = require('express');
const prisma = require('../prisma');
const requireAuth = require('../middleware/auth');
const { sendPushNotification } = require('../push');

const router = express.Router();

// GET /reels
router.get('/', async (req, res, next) => {
  try {
    const reels = await prisma.reel.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { likes: true } },
      },
    });
    res.json(reels);
  } catch (err) {
    next(err);
  }
});

// POST /reels — { videoUrl, caption }
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { videoUrl, caption } = req.body;
    if (!videoUrl) return res.status(400).json({ error: 'videoUrl inahitajika' });

    const reel = await prisma.reel.create({
      data: { userId: req.userId, videoUrl, caption },
    });
    res.status(201).json(reel);
  } catch (err) {
    next(err);
  }
});

// POST /reels/:id/like
router.post('/:id/like', requireAuth, async (req, res, next) => {
  try {
    const reelId = req.params.id;
    const existing = await prisma.reelLike.findUnique({
      where: { userId_reelId: { userId: req.userId, reelId } },
    });

    if (existing) {
      await prisma.reelLike.delete({ where: { id: existing.id } });
      return res.json({ liked: false });
    }

    await prisma.reelLike.create({ data: { userId: req.userId, reelId } });

    const reel = await prisma.reel.findUnique({ where: { id: reelId }, include: { user: true } });
    if (reel && reel.userId !== req.userId) {
      sendPushNotification(reel.user.pushToken, 'Snapa', 'Mtu amependa reel yako 🎬');
    }

    res.json({ liked: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
