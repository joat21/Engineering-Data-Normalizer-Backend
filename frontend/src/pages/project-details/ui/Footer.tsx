import { Button } from "@heroui/react";
import { downloadExcel, formatPrice } from "../model/utils";
import { FileDown } from "lucide-react";

interface FooterProps {
  projectId: string;
  projectName: string;
  totalProjectPrice: number;
}

export const Footer = ({
  totalProjectPrice,
  projectId,
  projectName,
}: FooterProps) => {
  return (
    <div className="flex justify-between items-center">
      <Button
        onPress={() => downloadExcel(projectId, projectName)}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        <FileDown size={18} />
        Экспортировать в Excel
      </Button>

      <div className="flex gap-4 items-baseline">
        <span className="text-lg">Общая стоимость проекта:</span>
        <span className="text-2xl font-bold text-accent">
          {formatPrice(totalProjectPrice)} ₽
        </span>
      </div>
    </div>
  );
};
