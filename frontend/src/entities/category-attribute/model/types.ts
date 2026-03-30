import type {
  AttributeOption,
  DataType,
} from "@engineering-data-normalizer/shared";

export interface BaseAttributeFieldProps {
  attributeKey: string;
  label: string;
  variant?: "primary" | "secondary"; // тут в идеале взять тип из HeroUI
}

export interface StringFieldProps extends BaseAttributeFieldProps {
  options: AttributeOption[];
}

export interface NumberFieldProps extends BaseAttributeFieldProps {
  unit: string | null;
  options: AttributeOption[];
}

export interface BooleanFieldProps extends BaseAttributeFieldProps {}

export type AttributeFieldProps =
  | (StringFieldProps & { dataType: typeof DataType.STRING })
  | (NumberFieldProps & { dataType: typeof DataType.NUMBER })
  | (BooleanFieldProps & { dataType: typeof DataType.BOOLEAN });
