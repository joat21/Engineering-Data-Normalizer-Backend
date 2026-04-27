import { v4 as uuidv4 } from "uuid";

export const booleanNormalizationOptions = [
  {
    id: uuidv4(),
    label: "Да",
    normalized: { valueBoolean: true, valueString: "Да" },
  },
  {
    id: uuidv4(),
    label: "Нет",
    normalized: { valueBoolean: false, valueString: "Нет" },
  },
];

export const DEFAULT_BOOLEAN_VALUES: Record<string, boolean> = {
  да: true,
  yes: true,
  true: true,
  "1": true,
  есть: true,
  "+": true,
  вкл: true,

  нет: false,
  no: false,
  false: false,
  "0": false,
  "-": false,
  выкл: false,
};
