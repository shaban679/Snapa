const express = require('express');
const prisma = require('../prisma');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /users/me — profile ya mtumiaji aliye-login
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true, username: true, email: true, bio: true, avatarUrl: true,
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// GET /users/:username — profile ya umma
router.get('/:username', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: {
        id: true, username: true, bio: true, avatarUrl: true,
        posts: { orderBy: { createdAt: 'desc' } },
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'Mtumiaji hajapatikana' });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PATCH /users/me — hariri bio/avatar
router.patch('/me', requireAuth, async (req, res, next) => {
  try {
    const { bio, avatarUrl } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { bio, avatarUrl },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PATCH /users/me/push-token — hifadhi Expo push token kwa arifa
router.patch('/me/push-token', requireAuth, async (req, res, next) => {
  try {
    const { pushToken } = req.body;
    await prisma.user.update({ where: { id: req.userId }, data: { pushToken } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
