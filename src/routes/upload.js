const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const requireAuth = require('../middleware/auth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const S3_CONFIGURED = !!(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY);

// Saraka ya ndani kwa maendeleo/testing bila akaunti ya S3
const LOCAL_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });

// POST /upload — inapokea "file" (multipart/form-data), inarudisha { url }
router.post('/', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file inahitajika' });

    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `${req.userId}-${Date.now()}${ext}`;

    if (S3_CONFIGURED) {
      const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
      const s3 = new S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT || undefined, // weka hii kwa Cloudflare R2
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY,
          secretAccessKey: process.env.S3_SECRET_KEY,
        },
      });

      await s3.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: filename,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: 'public-read',
      }));

      const url = process.env.S3_PUBLIC_URL
        ? `${process.env.S3_PUBLIC_URL}/${filename}`
        : `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${filename}`;

      return res.status(201).json({ url });
    }

    // Fallback: hifadhi kwenye diski ya server (nzuri kwa dev, si kwa production)
    fs.writeFileSync(path.join(LOCAL_DIR, filename), req.file.buffer);
    const url = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
    res.status(201).json({ url });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
