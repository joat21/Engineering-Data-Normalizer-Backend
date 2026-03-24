import {
  useImportStore,
  useMappingMutation,
  useStagingTable,
} from "@/features/import";
import { Spinner, Table, type Key } from "@heroui/react";

import { EditDropdown } from "./EditDropdown";
import { AppSelect } from "@/shared/ui";
import { useCategoryAttributes } from "@/entities/category-attribute";
import {
  MappingTargetType,
  type MappingTarget,
} from "@engineering-data-normalizer/shared";

interface MapColumnsProps {
  sessionId: string;
}

export const MapColumns = ({ sessionId }: MapColumnsProps) => {
  const mappingMutation = useMappingMutation();

  const { data: table, isPending: isTablePending } = useStagingTable({
    sessionId,
  });

  const { data: attributes, isPending: isAttributesPending } =
    useCategoryAttributes("84eb045d-ca69-4446-9d2f-8f8184c72180");

  if (!attributes || !table || isTablePending || isAttributesPending)
    return <Spinner />;

  const { columns, rows } = table;

  const handleSelectAttribute = (colIndex: number, value: Key | null) => {
    const attr = attributes.find((a) => a.id === value);
    if (!attr) return;

    const target: MappingTarget =
      attr.type === MappingTargetType.ATTRIBUTE
        ? { type: MappingTargetType.ATTRIBUTE, id: attr.id }
        : { type: MappingTargetType.SYSTEM, field: attr.id as any };

    console.log(colIndex, target);

    mappingMutation.mutate({ sessionId, colIndex, target });
  };

  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label="staging table">
          <Table.Header>
            {columns.map((col) => (
              <Table.Column key={col.id} isRowHeader>
                <div className="flex flex-col gap-1">
                  <span>{col.label}</span>
                  <AppSelect
                    items={attributes}
                    getItemKey={(attr) => attr.id}
                    getItemLabel={(attr) => attr.label}
                    aria-label="Атрибуты"
                    isPending={isAttributesPending}
                    placeholder="Атрибут"
                    onChange={(value) =>
                      handleSelectAttribute(col.originIndex, value)
                    }
                  />
                  <EditDropdown />
                </div>
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>
            {rows.map((row) => (
              <Table.Row key={row.id}>
                {Object.entries(row.values).map(([key, value]) => (
                  <Table.Cell key={key}>{value}</Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
};
