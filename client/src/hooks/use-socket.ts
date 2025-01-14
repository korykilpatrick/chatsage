import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from './use-user';

// Initialize socket instance outside of hook for reuse
let globalSocket: Socket | null = null;

const initializeSocket = () => {
  if (!globalSocket) {
    globalSocket = io('', {
      path: '/socket.io',
      autoConnect: true,
      transports: ['websocket']
    });

    globalSocket.on("connect", () => {
      console.log("Socket connected");
    });

    globalSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  }
  return globalSocket;
};

export function useSocket() {
  const { user } = useUser();

  // Initialize socket synchronously
  const socket = initializeSocket();

  useEffect(() => {
    // Cleanup only when component is unmounted and no other components are using the socket
    return () => {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
      }
    };
  }, []);

  useEffect(() => {
    if (user && socket) {
      socket.emit('presence_update', {
        userId: user.id,
        presence: 'ONLINE'
      });
    }
  }, [user, socket]);

  return socket;
}