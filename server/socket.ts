import { Server } from "http";
import { Server as SocketServer } from "socket.io";
import { db } from "@db";
import { messages, users, type User } from "@db/schema";
import { eq } from "drizzle-orm";

// Define the presence type based on our schema
type UserPresence = User['lastKnownPresence'];

interface PresenceUpdateData {
  userId: number;
  presence: UserPresence;
}

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

    socket.on("presence_update", async (data: PresenceUpdateData) => {
      await db.update(users)
        .set({ 
          lastKnownPresence: data.presence,
          updatedAt: new Date()
        })
        .where(eq(users.id, data.userId))
        .execute();

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