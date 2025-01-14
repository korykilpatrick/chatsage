import { FC, useState } from "react";
import { useLocation } from "wouter";
import type { Channel } from "@/types/schema";
import ChannelHeader from "./ChannelHeader";
import ChannelListEntry from "./ChannelListEntry";
import CreateChannelButton from "./CreateChannelButton";

interface ChannelListProps {
  channels: Channel[];
}

export const ChannelList: FC<ChannelListProps> = ({ channels }) => {
  const [location, setLocation] = useLocation();
  const [isPublicExpanded, setIsPublicExpanded] = useState(true);
  const [isPrivateExpanded, setIsPrivateExpanded] = useState(true);

  const publicChannels = channels.filter(c => c.type === 'PUBLIC');
  const privateChannels = channels.filter(c => c.type === 'PRIVATE');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground">
          CHANNELS
        </span>
        <CreateChannelButton />
      </div>

      <ChannelHeader
        title={`PUBLIC (${publicChannels.length})`}
        isExpanded={isPublicExpanded}
        onToggle={() => setIsPublicExpanded(!isPublicExpanded)}
      />

      {isPublicExpanded && (
        <div className="space-y-1">
          {publicChannels.map(channel => (
            <ChannelListEntry
              key={channel.id}
              channel={channel}
              isActive={location === `/channels/${channel.id}`}
              onClick={() => setLocation(`/channels/${channel.id}`)}
            />
          ))}
        </div>
      )}

      {privateChannels.length > 0 && (
        <>
          <ChannelHeader
            title={`PRIVATE (${privateChannels.length})`}
            isExpanded={isPrivateExpanded}
            onToggle={() => setIsPrivateExpanded(!isPrivateExpanded)}
          />

          {isPrivateExpanded && (
            <div className="space-y-1">
              {privateChannels.map(channel => (
                <ChannelListEntry
                  key={channel.id}
                  channel={channel}
                  isActive={location === `/channels/${channel.id}`}
                  onClick={() => setLocation(`/channels/${channel.id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChannelList;