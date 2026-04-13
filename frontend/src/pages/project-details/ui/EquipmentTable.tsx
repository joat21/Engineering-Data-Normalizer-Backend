import { Table } from "@heroui/react";
import { formatPrice } from "../model/utils";

interface EquipmentTableProps {
  items: {
    id: string;
    equipmentId: string;
    amount: number;
    name: string | null;
    manufacturerName: string | null;
    supplierName: string | null;
    article: string | null;
    model: string | null;
    externalCode: string | null;
    price: string;
  }[];
}

export const EquipmentTable = ({ items }: EquipmentTableProps) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <Table.Content aria-label="Оборудование">
          <Table.Header>
            <Table.Row className="bg-default/5 hover:bg-default/5">
              <Table.Column isRowHeader>Наименование</Table.Column>
              <Table.Column>Производитель</Table.Column>
              <Table.Column>Поставщик</Table.Column>
              <Table.Column>Модель</Table.Column>
              <Table.Column>Артикул</Table.Column>
              <Table.Column>Код</Table.Column>
              <Table.Column className="text-right">Цена за ед.</Table.Column>
              <Table.Column className="text-center">Кол-во</Table.Column>
              <Table.Column className="text-right">Стоимость</Table.Column>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {items.map((item) => {
              const unitPrice = parseFloat(item.price || "0");
              const totalPrice = unitPrice * item.amount;

              return (
                <Table.Row key={item.id}>
                  <Table.Cell className="font-medium">
                    {item.name || "—"}
                  </Table.Cell>
                  <Table.Cell>{item.manufacturerName || "—"}</Table.Cell>
                  <Table.Cell>{item.supplierName || "—"}</Table.Cell>
                  <Table.Cell>{item.model || "—"}</Table.Cell>
                  <Table.Cell>{item.article || "—"}</Table.Cell>
                  <Table.Cell>{item.externalCode || "—"}</Table.Cell>
                  <Table.Cell className="text-right">
                    {formatPrice(unitPrice)}
                  </Table.Cell>
                  <Table.Cell className="text-center">{item.amount}</Table.Cell>
                  <Table.Cell className="text-right">
                    {formatPrice(totalPrice)}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Content>
      </Table>
    </div>
  );
};
