const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('./prisma');
const { sendPushNotification } = require('./push');

function setupSocket(httpServer) {
  const io = new Server(httpServer, { cors: { origin: '*' } });

  // Thibitisha mtumiaji kwa JWT anapounganisha
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.userId;
      next();
    } catch (err) {
      next(new Error('Token si sahihi'));
    }
  });

  io.on('connection', (socket) => {
    // Kila mtumiaji anajiunga na "room" yake mwenyewe (id yake)
    socket.join(socket.userId);

    // Tuma ujumbe: { to: receiverId, text }
    socket.on('dm:send', async ({ to, text }) => {
      if (!to || !text) return;
      const message = await prisma.message.create({
        data: { senderId: socket.userId, receiverId: to, text },
      });
      io.to(to).emit('dm:new', message);
      io.to(socket.userId).emit('dm:new', message); // rudisha kwa mtumaji mwenyewe pia

      const receiver = await prisma.user.findUnique({ where: { id: to } });
      sendPushNotification(receiver?.pushToken, 'Ujumbe mpya', text);
    });

    // Onyesha "anaandika..."
    socket.on('dm:typing', ({ to }) => {
      if (to) io.to(to).emit('dm:typing', { from: socket.userId });
    });
  });

  return io;
}

module.exports = setupSocket;
