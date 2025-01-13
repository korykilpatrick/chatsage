import { useState } from "react";
import { useSocket } from "@/hooks/use-socket";
import { useUser } from "@/hooks/use-user";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

export default function MessageInput() {
  const [message, setMessage] = useState("");
  const socket = useSocket();
  const { user } = useUser();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    socket?.emit('new_message', {
      content: message,
      userId: user.id,
      channelId: 1 // TODO: Dynamic channel ID
    });

    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
