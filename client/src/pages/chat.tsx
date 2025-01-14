import { useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useUser } from "@/hooks/use-user";
import ChannelList from "@/components/chat/channel-list";
import MessageList from "@/components/chat/message-list";
import MessageInput from "@/components/chat/message-input";
import UserStatus from "@/components/chat/user-status";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Channel } from "@/types";

export default function Chat() {
  const socket = useSocket();
  const { user, logout } = useUser();
  const { data: channels } = useQuery<Channel[]>({
    queryKey: ['/api/channels'],
    enabled: !!user
  });

  useEffect(() => {
    if (channels?.length > 0) {
      channels.forEach(channel => {
        socket?.emit('join_channel', channel.id);
      });
    }
  }, [channels, socket]);

  if (!user) return null;

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-muted border-r flex flex-col">
        <div className="p-4 border-b">
          <UserStatus user={user} />
          <Button variant="ghost" onClick={() => logout()} className="w-full mt-2">
            Logout
          </Button>
        </div>
        <ChannelList channels={channels || []} />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <MessageList />
        <MessageInput />
      </div>
    </div>
  );
}