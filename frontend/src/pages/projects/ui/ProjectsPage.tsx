import { useProjects } from "@/entities/project";
import { AppLink, PageLoader } from "@/shared/ui";
import { Button, useOverlayState } from "@heroui/react";
import { Plus } from "lucide-react";
import { ProjectCard } from "./ProjectCard";
import { EmptyState } from "./EmptyState";
import { CreateProjectModal } from "@/features/create-project";

export const ProjectsPage = () => {
  const createProjectModal = useOverlayState();
  const { data: projects, isPending } = useProjects();

  if (isPending) return <PageLoader />;

  return (
    <>
      <div className="flex flex-col gap-8 mx-auto px-4 w-full max-w-350">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-semibold">Проекты</h1>

          <Button
            onPress={createProjectModal.open}
            className="flex items-center gap-2"
          >
            <Plus size={18} /> Создать проект
          </Button>
        </div>

        {projects?.length === 0 ? (
          <EmptyState onCreateProject={createProjectModal.open} />
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map((project) => (
              <li key={project.id} className="w-full list-none">
                <AppLink
                  to={`/projects/${project.id}`}
                  className="w-full no-underline"
                >
                  <ProjectCard project={project} />
                </AppLink>
              </li>
            ))}
          </ul>
        )}
      </div>

      <CreateProjectModal
        onClose={createProjectModal.close}
        isOpen={createProjectModal.isOpen}
      />
    </>
  );
};
