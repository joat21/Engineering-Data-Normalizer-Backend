import { Checkbox, Label } from "@heroui/react";
import type { BooleanFieldProps } from "../model/types";

export const BooleanAttributeField = ({
  attributeKey,
  label,
  variant,
}: BooleanFieldProps) => {
  return (
    <Checkbox key={attributeKey} name={attributeKey} variant={variant}>
      <Checkbox.Control>
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Checkbox.Content>
        <Label className="text-base">{label}</Label>
      </Checkbox.Content>
    </Checkbox>
  );
};
