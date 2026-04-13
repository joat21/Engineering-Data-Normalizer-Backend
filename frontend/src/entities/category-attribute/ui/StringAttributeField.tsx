import { useState } from "react";
import { Button, Input, Label, Tooltip } from "@heroui/react";
import { List, Plus } from "lucide-react";
import type { StringFieldProps } from "../model/types";
import { AppSelect } from "@/shared/ui";

export const StringAttributeField = ({
  attributeKey,
  label,
  options,
  variant,
}: StringFieldProps) => {
  const hasOptions = options.length > 0;
  const [isManualInput, setIsManualInput] = useState(!hasOptions);

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-base">{label}</Label>

      <div className="flex gap-1">
        {isManualInput ? (
          <Input
            className="w-full"
            name={attributeKey}
            placeholder={label}
            aria-label={label}
            variant={variant}
          />
        ) : (
          <AppSelect
            name={attributeKey}
            items={options.map((o) => ({ id: o.id, label: o.label }))}
            getItemKey={(o) => o.id}
            getItemLabel={(o) => o.label}
            className="w-full"
            aria-label={label}
            variant={variant}
          />
        )}

        {hasOptions && (
          <Tooltip delay={0} closeDelay={0}>
            <Button isIconOnly onPress={() => setIsManualInput(!isManualInput)}>
              {isManualInput ? <List /> : <Plus />}
            </Button>
            <Tooltip.Content>
              {isManualInput ? "Выбрать из списка" : "Ввести вручную"}
            </Tooltip.Content>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
