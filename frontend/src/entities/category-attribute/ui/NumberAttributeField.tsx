import { useState } from "react";
import { Button, Label, Tooltip } from "@heroui/react";
import { ArrowLeftRight, Variable } from "lucide-react";
import type { BaseAttributeFieldProps, NumberFieldProps } from "../model/types";
import { AppNumberField } from "@/shared/ui";

export const NumberAttributeField = ({
  attributeKey,
  label,
  unit,
  variant,
}: NumberFieldProps) => {
  const [isRange, setIsRange] = useState(false);

  return (
    <div className="flex flex-col gap-2 group">
      <div className="flex justify-between items-end px-1">
        <Label className="text-base">
          {label}{" "}
          {unit && <span className="text-foreground/80 ml-1">({unit})</span>}
        </Label>
      </div>

      <div className="flex gap-2 items-start">
        <div className="flex-1">
          {isRange ? (
            <RangeField
              variant={variant}
              attributeKey={attributeKey}
              label={label}
            />
          ) : (
            <ExactField
              variant={variant}
              attributeKey={attributeKey}
              label={label}
            />
          )}
        </div>

        <Tooltip delay={0} closeDelay={0}>
          <Button isIconOnly onPress={() => setIsRange(!isRange)}>
            {isRange ? <Variable /> : <ArrowLeftRight />}
          </Button>
          <Tooltip.Content>
            <p>{isRange ? "Число" : "Диапазон"}</p>
          </Tooltip.Content>
        </Tooltip>
      </div>
    </div>
  );
};

const ExactField = ({
  attributeKey,
  label,
  variant,
}: BaseAttributeFieldProps) => {
  return (
    <AppNumberField
      aria-label={label}
      name={`${attributeKey}_valueMin`}
      placeholder={label}
      variant={variant}
    />
  );
};

const RangeField = ({
  attributeKey,
  label,
  variant,
}: BaseAttributeFieldProps) => {
  return (
    <div className="flex gap-1">
      <AppNumberField
        aria-label={label}
        name={`${attributeKey}_valueMin`}
        placeholder="Минимум"
        variant={variant}
      />
      <AppNumberField
        aria-label={label}
        name={`${attributeKey}_valueMax`}
        placeholder="Максимум"
        variant={variant}
      />
    </div>
  );
};
