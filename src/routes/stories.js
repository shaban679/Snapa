const express = require('express');
const prisma = require('../prisma');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /stories — stories zisizoisha muda, za watu ninaowafuata + zangu
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const following = await prisma.follow.findMany({
      where: { followerId: req.userId },
      select: { followingId: true },
    });
    const userIds = [req.userId, ...following.map(f => f.followingId)];

    const stories = await prisma.story.findMany({
      where: { userId: { in: userIds }, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true, avatarUrl: true } } },
    });
    res.json(stories);
  } catch (err) {
    next(err);
  }
});

// POST /stories — tengeneza story (inaisha muda baada ya masaa 24)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { mediaUrl } = req.body;
    if (!mediaUrl) return res.status(400).json({ error: 'mediaUrl inahitajika' });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const story = await prisma.story.create({
      data: { userId: req.userId, mediaUrl, expiresAt },
    });
    res.status(201).json(story);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
