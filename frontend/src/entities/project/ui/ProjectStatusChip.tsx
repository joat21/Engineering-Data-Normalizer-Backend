import { Chip, cn } from "@heroui/react";
import { Archive, Clock } from "lucide-react";

interface ProjectStatusChipProps {
  isArchived: boolean;
}

export const ProjectStatusChip = ({ isArchived }: ProjectStatusChipProps) => {
  return (
    <Chip
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-xl bg-accent w-fit text-sm text-white",
        isArchived && "bg-default text-foreground",
      )}
    >
      {isArchived ? (
        <>
          <Archive size={12} /> В архиве
        </>
      ) : (
        <>
          <Clock size={12} /> Активен
        </>
      )}
    </Chip>
  );
};
