import { DataType } from "@engineering-data-normalizer/shared";
import { StringAttributeField } from "./StringAttributeField";
import { NumberAttributeField } from "./NumberAttributeField";
import { BooleanAttributeField } from "./BooleanAttributeField";
import type { AttributeFieldProps } from "../model/types";

export const AttributeField = (props: AttributeFieldProps) => {
  switch (props.dataType) {
    case DataType.STRING:
      return <StringAttributeField {...props} />;

    case DataType.NUMBER:
      return <NumberAttributeField {...props} />;

    case DataType.BOOLEAN:
      return <BooleanAttributeField {...props} />;

    default:
      const _exhaustive: never = props;
      return _exhaustive;
  }
};
