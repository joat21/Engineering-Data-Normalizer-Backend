import { useParams } from "react-router";
import { ArrowLeft, Edit2 } from "lucide-react";
import { Button, useOverlayState } from "@heroui/react";
import { EquipmentTable } from "./EquipmentTable";
import { Footer } from "./Footer";
import { EditProjectModal } from "@/features/edit-project";
import { ProjectStatusChip, useProjectDetails } from "@/entities/project";
import { AppLink, PageLoader } from "@/shared/ui";

export const ProjectDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const editModal = useOverlayState();

  const { data: project, isPending } = useProjectDetails({ id: id! });

  if (isPending) return <PageLoader />;
  if (!project) return <div>Проект не найден</div>;

  const { name, description, isArchived, items } = project;

  const totalProjectPrice = project.items.reduce((acc, item) => {
    const price = parseFloat(item.priceInRub || "0");
    return acc + price * item.amount;
  }, 0);

  return (
    <>
      <div className="flex flex-col gap-8 mx-auto px-4 w-full max-w-7xl">
        <div>
          <AppLink
            to="/projects"
            className="inline-flex items-center gap-2 text-default-500 hover:text-accent transition-colors"
          >
            <ArrowLeft size={16} /> К списку проектов
          </AppLink>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-semibold">{name}</h1>
            <p className="max-w-2xl">{description}</p>
            <ProjectStatusChip isArchived={isArchived} />
          </div>
          <Button variant="primary" onPress={editModal.open}>
            <Edit2 size={18} className="mr-2" />
            Редактировать
          </Button>
        </div>

        <div className="flex flex-col gap-5 p-4 border border-default/10 rounded-2xl bg-white shadow-sm overflow-hidden">
          <h2 className="text-xl font-medium">Перечень оборудования</h2>
          {items.length ? (
            <EquipmentTable items={items} />
          ) : (
            <div className="flex justify-center items-center">
              <span className="">В проекте пока нет оборудования</span>
            </div>
          )}

          {items.length > 0 && (
            <Footer
              totalProjectPrice={totalProjectPrice}
              projectId={project.id}
              projectName={name}
            />
          )}
        </div>
      </div>

      <EditProjectModal project={project} state={editModal} />
    </>
  );
};
