import { SYSTEM_FIELDS_CONFIG } from "./constants";
import type { FieldContext, SystemFieldsConfig } from "./types";

export const getSystemFields = (context?: FieldContext) => {
  const allFields = SYSTEM_FIELDS_CONFIG as SystemFieldsConfig;

  if (!context) return allFields;

  const filteredEntries = Object.entries(allFields).filter(([_, config]) => {
    if (config.excludeContexts && config.excludeContexts.includes(context)) {
      return false;
    }

    // Если контексты не заданы - поле универсальное
    if (!config.contexts) return true;

    return config.contexts.includes(context);
  });

  return Object.fromEntries(filteredEntries) as Partial<SystemFieldsConfig>;
};
