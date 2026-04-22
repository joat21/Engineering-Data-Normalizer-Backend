import { SYSTEM_FIELDS_CONFIG } from "@engineering-data-normalizer/shared";
import {
  ImportStatus,
  ImportItemStatus,
  Equipment,
  Manufacturer as PrismaManufacturer,
  Supplier as PrismaSupplier,
  Currency as PrismaCurrency,
} from "../generated/prisma/client";

export type Manufacturer = PrismaManufacturer;
export type Supplier = PrismaSupplier;
export type Currency = PrismaCurrency;

export const ImportSessionStatus = ImportStatus;
export type ImportSessionStatus =
  (typeof ImportSessionStatus)[keyof typeof ImportSessionStatus];

export const StagingImportItemStatus = ImportItemStatus;
export type StagingImportItemStatus =
  (typeof StagingImportItemStatus)[keyof typeof StagingImportItemStatus];

// Эти типы не используются в коде, но TS выдаст ошибку,
// если ключи в конфиге не совпадут с полями в модели Prisma
type _EnsureFieldsMatch<T extends keyof Equipment> = T;
type _Verified = _EnsureFieldsMatch<keyof typeof SYSTEM_FIELDS_CONFIG>;

export type EquipmentSystemFields = Pick<
  Equipment,
  keyof typeof SYSTEM_FIELDS_CONFIG
>;
