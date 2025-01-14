import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSocket } from "@/hooks/use-socket";
import type { User } from "@db/schema";

type UserPresence = 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE';

type UserStatusProps = {
  user: User;
};

export default function UserStatus({ user }: UserStatusProps) {
  const [presence, setPresence] = useState<UserPresence>(user.lastKnownPresence as UserPresence || 'ONLINE');
  const socket = useSocket();

  // Get initials from displayName if username is not available
  const getInitials = () => {
    if (user.displayName) {
      return user.displayName.slice(0, 2).toUpperCase();
    }
    return 'UN'; // Default fallback
  };

  const updatePresence = (newPresence: UserPresence) => {
    setPresence(newPresence);
    socket?.emit('presence_update', {
      userId: user.id,
      presence: newPresence
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Avatar>
        <AvatarImage src={`https://avatar.vercel.sh/${user.displayName}`} />
        <AvatarFallback>{getInitials()}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="font-semibold">{user.displayName}</div>
        <DropdownMenu>
          <DropdownMenuTrigger className="text-sm text-muted-foreground">
            {presence.toLowerCase()}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => updatePresence('ONLINE')}>
              Online
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updatePresence('AWAY')}>
              Away
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => updatePresence('DND')}>
              Do Not Disturb
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}