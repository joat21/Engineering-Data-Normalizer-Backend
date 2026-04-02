import { useState } from "react";
import { Button, Form, Input, Label, Modal, Tooltip } from "@heroui/react";
import { List, Plus } from "lucide-react";
import { resolveEntityId } from "../model/utils";
import {
  useCreateManufacturerMutation,
  useManufacturers,
} from "@/entities/manufacturer";
import { useCreateSupplierMutation, useSuppliers } from "@/entities/supplier";
import { AppSelect, PageLoader } from "@/shared/ui";

interface CatalogCommonDataModalProps {
  isOpen: boolean;
  onConfirm: (payload: {
    manufacturerId?: string;
    supplierId?: string;
  }) => void;
}

export const CatalogCommonDataModal = ({
  isOpen,
  onConfirm,
}: CatalogCommonDataModalProps) => {
  const [isManual, setIsManual] = useState(false);

  const { data: manufacturers, isPending: isManufacturersPending } =
    useManufacturers();
  const { data: suppliers, isPending: isSuppliersPending } = useSuppliers();

  const createManufacturerMutation = useCreateManufacturerMutation();
  const createSupplierMutation = useCreateSupplierMutation();

  if (isManufacturersPending || isSuppliersPending) return <PageLoader />;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const manufacturerId = String(formData.get("manufacturerId") ?? "");
    const manufacturerName = String(formData.get("manufacturerName") ?? "");

    const supplierId = String(formData.get("supplierId") ?? "");
    const supplierName = String(formData.get("supplierName") ?? "");

    const [finalManufacturerId, finalSupplierId] = await Promise.all([
      resolveEntityId(
        manufacturerId,
        manufacturerName,
        manufacturers ?? [],
        createManufacturerMutation.mutateAsync,
      ),
      resolveEntityId(
        supplierId,
        supplierName,
        suppliers ?? [],
        createSupplierMutation.mutateAsync,
      ),
    ]);

    onConfirm({
      manufacturerId: finalManufacturerId,
      supplierId: finalSupplierId,
    });
  };

  return (
    <Modal.Backdrop isOpen={isOpen}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Укажите дополнительную информацию</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <Form id="init" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1 w-full">
                  <Label htmlFor="manufacturer">Производитель</Label>
                  <div className="flex gap-1">
                    {isManual ? (
                      <Input
                        id="manufacturer"
                        name="manufacturerName"
                        placeholder="Производитель"
                        className="w-full"
                      />
                    ) : (
                      <AppSelect
                        id="manufacturer"
                        name="manufacturerId"
                        placeholder="Выберите производителя"
                        items={manufacturers ?? []}
                        getItemKey={(m) => m.id}
                        getItemLabel={(m) => m.name}
                        className="w-full"
                      />
                    )}
                    <Tooltip delay={0} closeDelay={0}>
                      <Button isIconOnly onPress={() => setIsManual(!isManual)}>
                        {isManual ? <List /> : <Plus />}
                      </Button>
                      <Tooltip.Content>
                        <p>
                          {isManual ? "Выбрать из списка" : "Ввести вручную"}
                        </p>
                      </Tooltip.Content>
                    </Tooltip>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="supplier">Поставщик</Label>
                  <div className="flex gap-1">
                    {isManual ? (
                      <Input
                        id="supplier"
                        name="supplierName"
                        placeholder="Поставщик"
                        className="w-full"
                      />
                    ) : (
                      <AppSelect
                        id="supplier"
                        name="supplierId"
                        placeholder="Выберите поставщика"
                        items={suppliers ?? []}
                        getItemKey={(m) => m.id}
                        getItemLabel={(m) => m.name}
                        className="w-full"
                      />
                    )}
                    <Tooltip delay={0} closeDelay={0}>
                      <Button isIconOnly onPress={() => setIsManual(!isManual)}>
                        {isManual ? <List /> : <Plus />}
                      </Button>
                      <Tooltip.Content>
                        <p>
                          {isManual ? "Выбрать из списка" : "Ввести вручную"}
                        </p>
                      </Tooltip.Content>
                    </Tooltip>
                  </div>
                </div>
              </div>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button type="submit" form="init">
              Сохранить
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
