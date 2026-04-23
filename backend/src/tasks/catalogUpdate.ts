import cron from "node-cron";
import { updateExchangeRates } from "../services/ReferenceDataService/updateExchangeRates";
import { recalculateEquipmentPrices } from "../services/EquipmentService/recalculateEquipmentPrices";
import { recalculateAllCategoryFilters } from "../services/CategoryService/recalculateFilters";

export const updatePrices = async () => {
  await updateExchangeRates();
  await recalculateEquipmentPrices();
  await recalculateAllCategoryFilters();
};

export const initPricesUpdate = () => {
  cron.schedule(
    process.env.UPDATE_PRICES_CRON_EXPRESSION || "0 5 * * *",
    updatePrices,
    {
      timezone: process.env.TIMEZONE,
    },
  );
};
