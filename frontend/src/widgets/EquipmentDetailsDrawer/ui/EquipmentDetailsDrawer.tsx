import { Button, Drawer, Table } from "@heroui/react";
import { Download, FileText, FolderKanban, GitCompare } from "lucide-react";
import { DetailsRow } from "./DetailsRow";
import { useEquipmentDetails } from "@/entities/equipment";
import { PageLoader } from "@/shared/ui";

interface EquipmentDetailsDrawerProps {
  equipmentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToProject: (equipmentId: string) => void;
  onCompare: (equipmentId: string) => void;
}

export const EquipmentDetailsDrawer = ({
  equipmentId,
  isOpen,
  onClose,
  onAddToProject,
  onCompare,
}: EquipmentDetailsDrawerProps) => {
  const { data: details, isFetching } = useEquipmentDetails({
    id: equipmentId ?? "",
  });

  if (isFetching) return <PageLoader />;

  return (
    <Drawer.Backdrop isOpen={isOpen}>
      <Drawer.Content placement="right">
        <Drawer.Dialog className="max-w-[30vw] w-full">
          <Drawer.CloseTrigger onPress={onClose} />
          <Drawer.Header>
            <Drawer.Heading className="text-xl">
              Информация об оборудовании
            </Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-6">
            <div className="flex gap-3">
              <Button onPress={() => onAddToProject(equipmentId!)}>
                <FolderKanban />В проект
              </Button>
              <Button variant="outline" onPress={() => onCompare(equipmentId!)}>
                <GitCompare />
                Сравнить
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-lg font-medium text-foreground">
                Основные данные
              </span>
              <Table aria-label="Основные данные">
                <Table.Content>
                  <Table.Header>
                    <Table.Column isRowHeader></Table.Column>
                    <Table.Column></Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {details?.systemFields.map((field) => (
                      <DetailsRow key={field.label} item={field} />
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-lg font-medium text-foreground">
                Технические характеристики
              </span>
              <Table aria-label="Технические характеристики">
                <Table.Content>
                  <Table.Header>
                    <Table.Column isRowHeader></Table.Column>
                    <Table.Column></Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {details?.attributes.map((attr) => (
                      <DetailsRow key={attr.label} item={attr} />
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-lg font-medium text-foreground">
                Источник данных
              </span>
              <div className="flex items-center gap-4 p-4 border rounded-lg w-full bg-white">
                <FileText className="text-primary" size={32} />
                <div className="flex-1 gap-2 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {details?.source.fileName}
                  </p>
                </div>
                <a
                  href={details?.source.url}
                  target="_blank"
                  className="flex gap-1 px-3 py-2 text-white rounded-xl bg-accent no-underline cursor-pointer"
                >
                  <Download />
                  <span>Скачать</span>
                </a>
              </div>
            </div>
          </Drawer.Body>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
};
