require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');

const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const userRoutes = require('./routes/users');
const followRoutes = require('./routes/follow');
const notificationRoutes = require('./routes/notifications');
const storyRoutes = require('./routes/stories');
const messageRoutes = require('./routes/messages');
const aiRoutes = require('./routes/ai');
const uploadRoutes = require('./routes/upload');
const reelRoutes = require('./routes/reels');
const setupSocket = require('./socket');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(require('path').join(__dirname, '..', 'uploads'))); // fallback ya dev bila S3

app.get('/', (req, res) => res.json({ status: 'Snapa API iko hai 🚀' }));

app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/users', userRoutes);
app.use('/follow', followRoutes);
app.use('/notifications', notificationRoutes);
app.use('/stories', storyRoutes);
app.use('/messages', messageRoutes);
app.use('/ai', aiRoutes);
app.use('/upload', uploadRoutes);
app.use('/reels', reelRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Hitilafu ya server' });
});

const server = http.createServer(app);
setupSocket(server); // DM za real-time kupitia WebSockets

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Snapa API inaendesha kwenye port ${PORT}`));
