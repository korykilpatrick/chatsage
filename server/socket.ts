import { Server } from "http";
import { Server as SocketServer } from "socket.io";
import { db } from "@db";
import { messages, users } from "@db/schema";
import { eq } from "drizzle-orm";

export function setupWebSocket(server: Server) {
  const io = new SocketServer(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    socket.on("join_channel", (channelId: string) => {
      socket.join(`channel:${channelId}`);
    });

    socket.on("leave_channel", (channelId: string) => {
      socket.leave(`channel:${channelId}`);
    });

    socket.on("presence_update", async (data: { userId: number; presence: string }) => {
      await db.update(users)
        .set({ presence: data.presence as any, lastSeen: new Date() })
        .where(eq(users.id, data.userId));
      
      io.emit("presence_changed", data);
    });

    socket.on("new_message", async (data: { channelId: number; content: string; userId: number }) => {
      const [newMessage] = await db.insert(messages)
        .values({
          content: data.content,
          userId: data.userId,
          channelId: data.channelId
        })
        .returning();

      io.to(`channel:${data.channelId}`).emit("message_received", newMessage);
    });

    socket.on("disconnect", () => {
      // Handle disconnect
    });
  });

  return io;
}
