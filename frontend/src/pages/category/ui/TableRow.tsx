import { Button, Chip, Table, Tooltip } from "@heroui/react";
import { Filter, Settings, Lock, Edit3, FilePen } from "lucide-react";
import {
  MappingTargetType,
  type CategoryAttribute,
} from "@engineering-data-normalizer/shared";
import { DATA_TYPE_CHIP_COLORS } from "../model/config";
import { DATA_TYPE_LABELS } from "@/config";

interface TableRowProps {
  attribute: CategoryAttribute;
  onClickEdit: (attrId: string) => void;
}

export const TableRow = ({ attribute, onClickEdit }: TableRowProps) => {
  const isSystem = attribute.type === MappingTargetType.SYSTEM;

  return (
    <Table.Row>
      <Table.Cell>
        <div className="flex items-center gap-2">
          {isSystem ? <Settings size={20} /> : <FilePen size={20} />}
          <span className="font-medium">{attribute.label}</span>
        </div>
      </Table.Cell>
      <Table.Cell>
        <Chip className={DATA_TYPE_CHIP_COLORS[attribute.dataType]}>
          {DATA_TYPE_LABELS[attribute.dataType]}
        </Chip>
      </Table.Cell>
      <Table.Cell>{attribute.unit || "—"}</Table.Cell>
      <Table.Cell>
        {attribute.isFilterable ? (
          <Tooltip delay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <Filter size={18} className="text-success" />
            </Tooltip.Trigger>
            <Tooltip.Content>Участвует в фильтрации</Tooltip.Content>
          </Tooltip>
        ) : (
          <span>—</span>
        )}
      </Table.Cell>
      <Table.Cell>
        {isSystem ? (
          <Tooltip delay={0} closeDelay={0}>
            <Tooltip.Trigger>
              <Lock size={18} />
            </Tooltip.Trigger>
            <Tooltip.Content>
              Системное поле нельзя редактировать
            </Tooltip.Content>
          </Tooltip>
        ) : (
          <Button isIconOnly onPress={() => onClickEdit(attribute.id)}>
            <Edit3 size={18} />
          </Button>
        )}
      </Table.Cell>
    </Table.Row>
  );
};
