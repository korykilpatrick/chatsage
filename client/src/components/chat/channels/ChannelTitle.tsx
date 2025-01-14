import { FC } from "react";
import { Hash, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Channel } from "@/types/schema";

interface ChannelTitleProps {
  channel: Channel;
  className?: string;
}

export const ChannelTitle: FC<ChannelTitleProps> = ({ channel, className }) => {
  const isPrivate = channel.type === 'PRIVATE';

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {isPrivate ? <Lock className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
      <span className="font-medium">{channel.name}</span>
    </div>
  );
};

export default ChannelTitle;