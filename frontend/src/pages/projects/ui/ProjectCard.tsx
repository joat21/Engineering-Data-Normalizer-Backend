import { Card } from "@heroui/react";
import { FolderOpen } from "lucide-react";
import type { Project } from "@engineering-data-normalizer/shared";
import { ProjectStatusChip } from "@/entities/project";

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const { name, description, isArchived } = project;

  return (
    <Card className="relative flex flex-col justify-start p-5 w-full min-h-40 border-2 border-default/50 group hover:border-accent hover:bg-accent/5 transition-all overflow-hidden">
      <div className="flex justify-between gap-1 transition-colors duration-200 group-hover:text-accent">
        <FolderOpen className="text-current" />
        <ProjectStatusChip isArchived={isArchived} />
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
