export type TransformPayload = string | number | null;

export const parseNumbers = (input: TransformPayload): number[] => {
  if (!input) return [];

  const str = typeof input === "string" ? input : String(input);
  return (str.match(/-?\d+(?:[.,]\d+)?/g) || []).map((n) =>
    Number(n.replace(",", ".")),
  );
};

export const splitBySeparator = (
  input: TransformPayload,
  separator: string,
): string[] => {
  if (!input) return [];

  const str = typeof input === "string" ? input : String(input);
  return str
    .split(separator)
    .map((s) => s.trim())
    .filter(Boolean);
};

export const multiply = (input: TransformPayload, factor: number) => {
  if (!input) return [];

  const num =
    typeof input === "number"
      ? input
      : parseFloat(String(input).replace(",", "."));
  return [isNaN(num) ? null : num * factor];
};
