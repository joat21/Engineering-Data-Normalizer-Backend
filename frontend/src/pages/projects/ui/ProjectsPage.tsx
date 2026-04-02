import { ProjectCard } from "./ProjectCard";
import { useProjects } from "@/entities/project";
import { AppLink, PageLoader } from "@/shared/ui";

export const ProjectsPage = () => {
  const { data: projects, isPending } = useProjects();

  if (isPending) return <PageLoader />;

  return (
    <div className="flex flex-col gap-3">
      <h1>Проекты</h1>
      {!projects?.length && <p>Проекты не найдены</p>}
      <ul>
        {projects?.map((project) => (
          <li key={project.id}>
            <AppLink key={project.id} to={project.id}>
              <ProjectCard project={project} />
            </AppLink>
          </li>
        ))}
      </ul>
    </div>
  );
};
