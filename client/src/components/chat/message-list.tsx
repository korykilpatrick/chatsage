import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSocket } from "@/hooks/use-socket";
import type { Message } from "@/types/schema";

export default function MessageList() {
  const socket = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], refetch, isLoading } = useQuery<Message[]>({
    queryKey: ['/api/channels/1/messages'], // TODO: Dynamic channel ID
  });

  useEffect(() => {
    socket?.on('message_received', () => {
      refetch();
    });

    return () => {
      socket?.off('message_received');
    };
  }, [socket, refetch]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ScrollArea ref={scrollRef} className="flex-1 p-4" role="region" aria-label="Message list">
      {isLoading ? (
        <div aria-label="Loading messages">Loading...</div>
      ) : (
        <div className="space-y-4" aria-label="Message container">
          {messages.map((message) => (
            <div key={message.id} className="flex items-start gap-3" role="listitem">
              <Avatar aria-label={`User ${message.userId}'s avatar`}>
                <AvatarImage
                  src={`https://avatar.vercel.sh/${message.userId}`}
                  alt={`User ${message.userId}'s avatar`}
                />
                <AvatarFallback>UN</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">User {message.userId}</span>
                  <span className="text-xs text-muted-foreground">
                    {message.createdAt && new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}