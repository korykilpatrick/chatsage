import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from './use-user';

export function useSocket() {
  const socket = useRef<Socket>();
  const { user } = useUser();

  useEffect(() => {
    if (!socket.current) {
      socket.current = io();

      socket.current.on("connect", () => {
        console.log("Socket connected");
      });

      socket.current.on("disconnect", () => {
        console.log("Socket disconnected");
      });
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (user && socket.current) {
      socket.current.emit('presence_update', {
        userId: user.id,
        presence: 'ONLINE'
      });
    }
  }, [user]);

  return socket.current;
}
