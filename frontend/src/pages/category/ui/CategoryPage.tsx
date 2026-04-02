import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { Button, Table, useOverlayState } from "@heroui/react";
import { useCategory } from "@/entities/category";
import { CreateCategoryAttributeModal } from "@/features/create-category-attibute";
import {
  MappingTargetType,
  type CategoryAttribute,
} from "@engineering-data-normalizer/shared";
import { TableRow } from "./TableRow";
import { HEADERS } from "../model/config";
import { EditCategoryAttributeModal } from "@/features/edit-category-attribute";
import { PageLoader } from "@/shared/ui";

export const CategoryPage = () => {
  const { id = "" } = useParams();
  const createCategoryAttributeModal = useOverlayState();
  const editCategoryAttributeModal = useOverlayState();

  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(
    null,
  );

  const { data: category, isPending } = useCategory({ id });

  const selectedAttr = category?.attributes.find(
    (a) => a.id === selectedAttributeId,
  );

  const [systemFields, technicalFields] = useMemo(() => {
    const systemFields =
      category?.attributes.filter((a) => a.type === MappingTargetType.SYSTEM) ||
      [];
    const technicalFields =
      category?.attributes.filter(
        (a) => a.type === MappingTargetType.ATTRIBUTE,
      ) || [];

    return [systemFields, technicalFields];
  }, [category?.attributes]);

  if (isPending) return <PageLoader />;

  const handleOpenEditModal = (attrId: string) => {
    setSelectedAttributeId(attrId);
    editCategoryAttributeModal.open();
  };

  const renderRow = (attribute: CategoryAttribute) => {
    return (
      <TableRow
        key={attribute.id}
        attribute={attribute}
        onClickEdit={handleOpenEditModal}
      />
    );
  };

  return (
    <>
      <div className="flex flex-col gap-8 mx-auto px-4 w-full max-w-350">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">Управление атрибутами</h1>
            <p>
              Здесь вы можете создавать и редактировать атрибуты категории{" "}
              <b>{category?.name}</b>
            </p>
          </div>
          <Button onPress={createCategoryAttributeModal.open}>
            + Создать атрибут
          </Button>
        </div>

        <Table>
          <Table.Content>
            <Table.Header>
              {HEADERS.map((header, i) => (
                <Table.Column isRowHeader key={i} className="text-base">
                  {header}
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body>
              {[...systemFields, ...technicalFields].map(renderRow)}
            </Table.Body>
          </Table.Content>
        </Table>
      </div>

      <CreateCategoryAttributeModal
        categoryId={id}
        isOpen={createCategoryAttributeModal.isOpen}
        onClose={createCategoryAttributeModal.close}
      />

      <EditCategoryAttributeModal
        attribute={selectedAttr}
        isOpen={editCategoryAttributeModal.isOpen}
        onClose={editCategoryAttributeModal.close}
      />
    </>
  );
};
