import {
  SYSTEM_FIELD_KEYS,
  SYSTEM_FIELDS_CONFIG,
} from "@engineering-data-normalizer/shared";

export const SYSTEM_FIELDS = Object.fromEntries(
  SYSTEM_FIELD_KEYS.map((key) => [key.toUpperCase(), key]),
) as { [K in keyof typeof SYSTEM_FIELDS_CONFIG as Uppercase<K>]: K };

export const DIMENSION_SEPARATORS_REGEX = /[\s]*[xх×][\s]*/;

export const cookieOptions = {
  httpOnly: true,
  sameSite: "none" as const,
  secure: true,
  path: "/",
};

export const CONVERTIBLE_EXTENSIONS = [".docx", ".doc", ".rtf", ".odt"];
