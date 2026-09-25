const express = require('express');
const prisma = require('../prisma');
const requireAuth = require('../middleware/auth');
const { sendPushNotification } = require('../push');

const router = express.Router();

// GET /posts — feed (posts za hivi karibuni)
router.get('/', async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    res.json(posts);
  } catch (err) {
    next(err);
  }
});

// POST /posts — tengeneza post mpya
// mediaUrl inapaswa kuwa imeshapakiwa kwenye storage (S3/Cloudflare R2) kabla;
// endpoint hii inapokea link tu. Kwa upload ya moja kwa moja, ongeza multer + S3 SDK.
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { mediaUrl, caption, hashtags } = req.body;
    if (!mediaUrl) return res.status(400).json({ error: 'mediaUrl inahitajika' });

    const post = await prisma.post.create({
      data: { userId: req.userId, mediaUrl, caption, hashtags },
    });
    res.status(201).json(post);
  } catch (err) {
    next(err);
  }
});

// POST /posts/:id/like — penda/toa like
router.post('/:id/like', requireAuth, async (req, res, next) => {
  try {
    const postId = req.params.id;
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: req.userId, postId } },
    });

    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } });
      return res.json({ liked: false });
    }

    await prisma.like.create({ data: { userId: req.userId, postId } });

    const post = await prisma.post.findUnique({ where: { id: postId }, include: { user: true } });
    if (post && post.userId !== req.userId) {
      await prisma.notification.create({
        data: { userId: post.userId, actorId: req.userId, type: 'like', postId },
      });
      sendPushNotification(post.user.pushToken, 'Snapa', 'Mtu amependa post yako ❤️');
    }

    res.json({ liked: true });
  } catch (err) {
    next(err);
  }
});

// GET /posts/:id/comments
router.get('/:id/comments', async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: req.params.id },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { username: true, avatarUrl: true } } },
    });
    res.json(comments);
  } catch (err) {
    next(err);
  }
});

// POST /posts/:id/comments
router.post('/:id/comments', requireAuth, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text inahitajika' });

    const comment = await prisma.comment.create({
      data: { userId: req.userId, postId: req.params.id, text },
    });

    const post = await prisma.post.findUnique({ where: { id: req.params.id }, include: { user: true } });
    if (post && post.userId !== req.userId) {
      await prisma.notification.create({
        data: { userId: post.userId, actorId: req.userId, type: 'comment', postId: post.id },
      });
      sendPushNotification(post.user.pushToken, 'Snapa', 'Mtu ametoa maoni kwenye post yako 💬');
    }

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
