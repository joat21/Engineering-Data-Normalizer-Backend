import { type Column, type Table } from "@tanstack/react-table";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import type { EquipmentRow } from "@engineering-data-normalizer/shared";
import { DraggableHeader } from "./DraggableHeader";
import { DraggableCell } from "./DraggableCell";

interface EquipmentTableProps {
  table: Table<EquipmentRow>;
}

export const EquipmentTable = ({ table }: EquipmentTableProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldOrder = table.getState().columnOrder;
      const oldIndex = oldOrder.indexOf(active.id as string);
      const newIndex = oldOrder.indexOf(over.id as string);

      table.setColumnOrder(arrayMove(oldOrder, oldIndex, newIndex));
    }
  };

  const handleChangeColumnPin = (column: Column<EquipmentRow, unknown>) => {
    const pinningPost = column.getIsPinned();
    column.pin(pinningPost === "left" ? false : "left");
  };

  const handleChangeColumnVisibility = (
    column: Column<EquipmentRow, unknown>,
  ) => {
    if (table.getVisibleLeafColumns().length === 1) return;
    column.toggleVisibility();
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToHorizontalAxis]}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full overflow-x-auto rounded-xl border border-default-200">
        <table className="w-full text-sm text-left table-fixed border-separate border-spacing-0">
          <thead className="bg-default-100 text-default-700 uppercase text-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                <SortableContext
                  items={table.getState().columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {headerGroup.headers.map((header) => (
                    <DraggableHeader
                      key={header.id}
                      header={header}
                      onPin={handleChangeColumnPin}
                      onHide={handleChangeColumnVisibility}
                    />
                  ))}
                </SortableContext>
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-default-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-default-50">
                <SortableContext
                  items={table.getState().columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {row.getVisibleCells().map((cell) => (
                    <DraggableCell key={cell.id} cell={cell} />
                  ))}
                </SortableContext>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DndContext>
  );
};
