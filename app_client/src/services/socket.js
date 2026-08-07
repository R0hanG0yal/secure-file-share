import { io } from 'socket.io-client';

let socket = null;

export function initSocket(username) {
  if (!socket) {
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Socket.io] Connected:', socket.id);
      if (username) {
        socket.emit('join_user', username);
      }
    });
  } else if (username) {
    socket.emit('join_user', username);
  }

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
