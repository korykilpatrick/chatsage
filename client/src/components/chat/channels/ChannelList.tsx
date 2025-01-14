import { FC, useState } from "react";
import { useLocation } from "wouter";
import type { Channel } from "@db/schema";
import ChannelHeader from "./ChannelHeader";
import ChannelListEntry from "./ChannelListEntry";

interface ChannelListProps {
  channels: Channel[];
}

export const ChannelList: FC<ChannelListProps> = ({ channels }) => {
  const [location, setLocation] = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  
  const publicChannels = channels.filter(c => c.type === 'PUBLIC');
  const privateChannels = channels.filter(c => c.type === 'PRIVATE');
  
  return (
    <div className="space-y-2">
      <ChannelHeader
        title={`CHANNELS (${publicChannels.length})`}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />
      
      {isExpanded && (
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
            title={`PRIVATE CHANNELS (${privateChannels.length})`}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
          />
          
          {isExpanded && (
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
