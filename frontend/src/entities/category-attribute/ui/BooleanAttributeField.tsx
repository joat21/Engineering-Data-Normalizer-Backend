import { Checkbox, Label } from "@heroui/react";
import { Controller, useFormContext } from "react-hook-form";
import type { BooleanFieldProps } from "../model/types";

export const BooleanAttributeField = ({
  attributeKey,
  label,
  variant,
}: BooleanFieldProps) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={attributeKey}
      control={control}
      render={({ field }) => (
        <Checkbox variant={variant} {...field}>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Checkbox.Content>
            <Label className="text-base">{label}</Label>
          </Checkbox.Content>
        </Checkbox>
      )}
    ></Controller>
  );
};
