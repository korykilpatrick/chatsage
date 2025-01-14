import { FC } from "react";
import { cn } from "@/lib/utils";
import type { Channel } from "@/types/schema";
import ChannelTitle from "./ChannelTitle";

interface ChannelListEntryProps {
  channel: Channel;
  isActive?: boolean;
  onClick?: () => void;
}

export const ChannelListEntry: FC<ChannelListEntryProps> = ({
  channel,
  isActive,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-2 py-1 text-left rounded hover:bg-accent/50 transition-colors",
        "flex items-center gap-2",
        isActive && "bg-accent"
      )}
    >
      <ChannelTitle channel={channel} />
      {channel.topic && (
        <span className="text-sm text-muted-foreground truncate">
          {channel.topic}
        </span>
      )}
    </button>
  );
};

export default ChannelListEntry;