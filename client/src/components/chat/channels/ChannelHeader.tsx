import { FC } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ChannelHeaderProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  className?: string;
}

export const ChannelHeader: FC<ChannelHeaderProps> = ({
  title,
  isExpanded,
  onToggle,
  className
}) => {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full px-2 py-1 text-xs font-semibold text-muted-foreground",
        "hover:text-foreground transition-colors flex items-center gap-1",
        className
      )}
    >
      {isExpanded ? (
        <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronRight className="w-3 h-3" />
      )}
      {title}
    </button>
  );
};

export default ChannelHeader;
