const { Server } = require('socket.io');
const Notification = require('../models/Notification');

let io = null;

const initSocket = (httpServer, clientOrigin = '*') => {
  io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Client joins room based on role and userId
    socket.on('join', (data) => {
      if (data && data.userId) {
        socket.join(`user_${data.userId}`);
      }
      if (data && data.vendorId) {
        socket.join(`vendor_${data.vendorId}`);
      }
      if (data && data.role === 'ADMIN') {
        socket.join('admin_room');
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
};

const getIO = () => io;

const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(`user_${userId.toString()}`).emit(event, data);
  }
};

const emitToVendor = (vendorId, event, data) => {
  if (io && vendorId) {
    io.to(`vendor_${vendorId.toString()}`).emit(event, data);
  }
};

const emitToAdmin = (event, data) => {
  if (io) {
    io.to('admin_room').emit(event, data);
  }
};

/**
 * Creates persistent notification in DB and emits real-time event.
 */
const sendNotification = async ({ userId, title, message, type = 'GENERAL', link = '' }) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      link,
    });

    emitToUser(userId, 'notification:new', notification);
    return notification;
  } catch (err) {
    console.warn('[SocketService] Notification error:', err.message);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToVendor,
  emitToAdmin,
  sendNotification,
};
