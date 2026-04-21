import { useEffect, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Button, Label, Tooltip } from "@heroui/react";
import { ArrowLeftRight, Variable } from "lucide-react";
import type { NumberFieldProps } from "../model/types";
import { AppNumberField } from "@/shared/ui";

export const NumberAttributeField = ({
  attributeKey,
  label,
  unit,
  variant,
}: NumberFieldProps) => {
  const { control, setValue } = useFormContext();
  const valMin = useWatch({ control, name: `${attributeKey}_valueMin` });
  const valMax = useWatch({ control, name: `${attributeKey}_valueMax` });

  const [isRange, setIsRange] = useState(false);

  useEffect(() => {
    if (valMin !== undefined && valMax !== undefined && valMin !== valMax) {
      setIsRange(true);
    }
  }, [valMin, valMax]);

  const toggleRange = () => {
    if (isRange) {
      setValue(`${attributeKey}_valueMax`, undefined);
    }
    setIsRange(!isRange);
  };

  return (
    <div className="flex flex-col gap-2 group">
      <div className="flex justify-between items-end px-1">
        <Label className="text-base">
          {label} {unit && `(${unit})`}
        </Label>
      </div>

      <div className="flex gap-2 items-start">
        <div className="flex-1">
          {isRange ? (
            <div className="flex gap-1">
              <NumericController
                name={`${attributeKey}_valueMin`}
                label="Минимум"
                variant={variant}
              />
              <NumericController
                name={`${attributeKey}_valueMax`}
                label="Максимум"
                variant={variant}
              />
            </div>
          ) : (
            <NumericController
              name={`${attributeKey}_valueMin`}
              label={label}
              variant={variant}
            />
          )}
        </div>

        <Tooltip delay={0} closeDelay={0}>
          <Button isIconOnly onPress={toggleRange}>
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

const NumericController = ({
  name,
  label,
  variant,
}: {
  name: string;
  label: string;
  variant: any;
}) => {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <AppNumberField
          aria-label={label}
          placeholder={label}
          variant={variant}
          className="w-full"
          {...field}
        />
      )}
    />
  );
};
