import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button, ButtonGroup, Toolbar } from "@heroui/react";
import { flexRender, type Column, type Header } from "@tanstack/react-table";
import { EyeOff, GripVertical, Pin, PinOff } from "lucide-react";
import type { EquipmentRow } from "@engineering-data-normalizer/shared";
import { getPinningStyles } from "../model/utils";

interface HeaderProps {
  header: Header<EquipmentRow, unknown>;
  onPin: (column: Column<EquipmentRow, unknown>) => void;
  onHide: (column: Column<EquipmentRow, unknown>) => void;
}

export const DraggableHeader = ({ header, onPin, onHide }: HeaderProps) => {
  const column = header.column;
  const isPinned = column.getIsPinned();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    disabled: !!isPinned,
  });

  const style: React.CSSProperties = {
    ...getPinningStyles(column),
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : undefined,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className="px-4 py-3 font-semibold bg-default-100 border-b border-default-200"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="truncate">
            {header.isPlaceholder
              ? null
              : flexRender(column.columnDef.header, header.getContext())}
          </span>
          {!isPinned && (
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-default-200 rounded"
            >
              <GripVertical size={14} className="text-default-400" />
            </div>
          )}
        </div>

        <Toolbar aria-label="Text formatting">
          <ButtonGroup variant="tertiary">
            <Button
              size="sm"
              isIconOnly
              onPress={() => onPin(column)}
              className="h-7 w-7"
            >
              {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
            </Button>
            <Button
              size="sm"
              isIconOnly
              onPress={() => onHide(column)}
              className="h-7 w-7"
            >
              <EyeOff size={14} />
            </Button>
          </ButtonGroup>
        </Toolbar>
      </div>
    </th>
  );
};
