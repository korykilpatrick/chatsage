import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Hash, Lock } from "lucide-react";
import type { Channel } from "@db/schema";

type ChannelListProps = {
  channels: Channel[];
};

export default function ChannelList({ channels }: ChannelListProps) {
  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {channels.map((channel) => (
          <Button
            key={channel.id}
            variant="ghost"
            className="w-full justify-start"
          >
            {channel.type === 'PRIVATE' ? <Lock className="w-4 h-4 mr-2" /> : <Hash className="w-4 h-4 mr-2" />}
            {channel.name}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
