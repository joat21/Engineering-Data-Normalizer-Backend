import { useEffect, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
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
  const { control } = useFormContext();
  const value = useWatch({ control, name: attributeKey });

  const hasOptions = options.length > 0;

  const [isManualInput, setIsManualInput] = useState(() => {
    if (!value) return !hasOptions;
    return !options.find((o) => o.label.toLowerCase() === value);
  });

  useEffect(() => {
    if (!value || !hasOptions) return;

    const exists = options.find(
      (o) => o.label.toLowerCase() === String(value).toLowerCase(),
    );

    if (!exists) setIsManualInput(true);
  }, [value, options]);

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-base">{label}</Label>

      <Controller
        name={attributeKey}
        control={control}
        render={({ field }) => (
          <div className="flex gap-1">
            {isManualInput ? (
              <Input
                className="w-full"
                placeholder={label}
                aria-label={label}
                variant={variant}
                {...field}
              />
            ) : (
              <AppSelect
                items={options}
                getItemKey={(o) => o.id}
                getItemLabel={(o) => o.label}
                className="w-full"
                aria-label={label}
                variant={variant}
                {...field}
              />
            )}

            {hasOptions && (
              <Tooltip delay={0} closeDelay={0}>
                <Button
                  isIconOnly
                  onPress={() => setIsManualInput(!isManualInput)}
                >
                  {isManualInput ? <List /> : <Plus />}
                </Button>
                <Tooltip.Content>
                  {isManualInput ? "Выбрать из списка" : "Ввести вручную"}
                </Tooltip.Content>
              </Tooltip>
            )}
          </div>
        )}
      ></Controller>
    </div>
  );
};
