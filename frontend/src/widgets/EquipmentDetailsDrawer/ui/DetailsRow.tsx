import { Table } from "@heroui/react";

interface DetailsRowProps {
  item: {
    label: string;
    value: string | null;
    unit?: string | null;
  };
}

export const DetailsRow = ({ item }: DetailsRowProps) => {
  const { label, unit, value } = item;

  return (
    <Table.Row>
      <Table.Cell>
        {label} {unit && `(${unit})`}
      </Table.Cell>
      <Table.Cell>{value ?? "—"}</Table.Cell>
    </Table.Row>
  );
};
