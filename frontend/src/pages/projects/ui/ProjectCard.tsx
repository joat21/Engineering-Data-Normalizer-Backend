import { Card, Chip, cn } from "@heroui/react";
import { Archive, Clock, FolderOpen } from "lucide-react";
import type { Project } from "@engineering-data-normalizer/shared";

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const { name, description, isArchived } = project;

  return (
    <Card className="relative flex flex-col justify-start p-5 w-full min-h-40 border-2 border-default/50 group hover:border-accent hover:bg-accent/5 transition-all overflow-hidden">
      <div className="flex justify-between gap-1 transition-colors duration-200 group-hover:text-accent">
        <FolderOpen className="text-current" />

        <Chip
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-xl bg-accent text-sm text-white",
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
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold group-hover:text-accent transition-colors leading-5 line-clamp-2">
          {name}
        </h3>
        <p className="text-gray-500 line-clamp-3">{description}</p>
      </div>
    </Card>
  );
};
