import { Button } from "@heroui/react";

interface EmptyStateProps {
  onCreateProject: () => void;
}

export const EmptyState = ({ onCreateProject }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-20 border-2 border-dashed border-default/20 rounded-xl text-xl">
      <p>У вас пока нет проектов</p>
      <Button onPress={onCreateProject}>Создать первый проект</Button>
    </div>
  );
};
