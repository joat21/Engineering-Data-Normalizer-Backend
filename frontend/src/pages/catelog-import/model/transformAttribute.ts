import type {
  CategoryAttribute,
  NormalizedValue,
} from "@engineering-data-normalizer/shared";

interface TransformAttributeArgs {
  formData: FormData;
  attr: CategoryAttribute;
}

export const transformAttribute = ({
  formData,
  attr,
}: TransformAttributeArgs) => {
  switch (attr.dataType) {
    case "STRING":
      return transformStringAttribute(formData, attr);
    case "NUMBER":
      return transformNumberAttribute(formData, attr.key);
    case "BOOLEAN":
      return transformBooleanAttribute(formData, attr.key);
  }
};

const transformStringAttribute = (
  formData: FormData,
  attr: CategoryAttribute,
) => {
  const strVal = String(formData.get(attr.key) ?? "");
  let rawValue = strVal;
  let normalized: NormalizedValue = { valueString: strVal };

  if (attr.options.length) {
    const selectedOption = attr.options.find((o) => o.id === strVal);

    if (selectedOption) {
      rawValue = selectedOption.normalized.valueString;
      normalized = selectedOption.normalized;
    }
  }

  return { normalized, rawValue };
};

const transformNumberAttribute = (formData: FormData, attrKey: string) => {
  let rawValue = "";
  let normalized: NormalizedValue = { valueString: "" };

  const rawMin = formData.get(`${attrKey}_valueMin`) ?? "";
  const rawMax = formData.get(`${attrKey}_valueMax`) ?? "";

  let min = rawMin !== "" ? Number(rawMin) : null;
  let max = rawMax !== "" ? Number(rawMax) : null;

  if (min === null && max === null) {
    return { normalized, rawValue };
  }

  if (min !== null && max === null) max = min;
  if (max !== null && min === null) min = max;

  rawValue = min === max ? `${min}` : `${min} - ${max}`;
  normalized = {
    valueMin: min ?? undefined,
    valueMax: max ?? undefined,
    valueString: rawValue,
  };

  return { normalized, rawValue };
};

const transformBooleanAttribute = (formData: FormData, attrKey: string) => {
  const boolVal = formData.get(attrKey) === "on";
  const rawValue = boolVal ? "Да" : "Нет";
  const normalized: NormalizedValue = {
    valueString: rawValue,
    valueBoolean: boolVal,
  };

  return { normalized, rawValue };
};
