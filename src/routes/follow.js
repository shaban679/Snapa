const express = require('express');
const prisma = require('../prisma');
const requireAuth = require('../middleware/auth');
const { sendPushNotification } = require('../push');

const router = express.Router();

// POST /follow/:userId — fuata mtumiaji
router.post('/:userId', requireAuth, async (req, res, next) => {
  try {
    const followingId = req.params.userId;
    if (followingId === req.userId) {
      return res.status(400).json({ error: 'Huwezi kujifuata mwenyewe' });
    }

    await prisma.follow.create({
      data: { followerId: req.userId, followingId },
    });

    await prisma.notification.create({
      data: { userId: followingId, actorId: req.userId, type: 'follow' },
    });

    const target = await prisma.user.findUnique({ where: { id: followingId } });
    sendPushNotification(target?.pushToken, 'Snapa', 'Mtu amekufuata ➕');

    res.status(201).json({ following: true });
  } catch (err) {
    if (err.code === 'P2002') return res.json({ following: true }); // tayari anafuata
    next(err);
  }
});

// DELETE /follow/:userId — acha kufuata
router.delete('/:userId', requireAuth, async (req, res, next) => {
  try {
    await prisma.follow.delete({
      where: {
        followerId_followingId: { followerId: req.userId, followingId: req.params.userId },
      },
    });
    res.json({ following: false });
  } catch (err) {
    next(err);
  }
});

// GET /follow/:userId/followers
router.get('/:userId/followers', async (req, res, next) => {
  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: req.params.userId },
      include: { follower: { select: { id: true, username: true, avatarUrl: true } } },
    });
    res.json(followers.map(f => f.follower));
  } catch (err) {
    next(err);
  }
});

// GET /follow/:userId/following
router.get('/:userId/following', async (req, res, next) => {
  try {
    const following = await prisma.follow.findMany({
      where: { followerId: req.params.userId },
      include: { following: { select: { id: true, username: true, avatarUrl: true } } },
    });
    res.json(following.map(f => f.following));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
