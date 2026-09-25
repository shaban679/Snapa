const express = require('express');
const prisma = require('../prisma');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// GET /notifications — arifa za mtumiaji aliye-login
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { actor: { select: { username: true, avatarUrl: true } } },
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

// PATCH /notifications/:id/read — weka alama imesomwa
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const notif = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });
    res.json(notif);
  } catch (err) {
    next(err);
  }
});

// PATCH /notifications/read-all
router.patch('/read-all', requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true },
    });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
