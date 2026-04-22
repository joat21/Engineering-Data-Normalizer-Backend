import axios from "axios";
import cron from "node-cron";
import { prisma } from "../../prisma";

interface ExchangeRatesResponse {
  Valute: Record<
    string,
    {
      Value: number;
      Nominal: number;
    }
  >;
}

export const updateRates = async () => {
  try {
    console.log("[LOG]: Updating exchange rates started");

    const { data } = await axios.get<ExchangeRatesResponse>(
      "https://www.cbr-xml-daily.ru/daily_json.js",
    );

    const existingCurrencies = await prisma.currency.findMany({
      select: { id: true, code: true },
    });

    const updates = existingCurrencies
      .map((curr) => {
        const valute = data.Valute[curr.code];
        if (!valute) return null;

        const ratePerUnit = valute.Value / (valute.Nominal || 1);

        return prisma.currency.update({
          where: { id: curr.id },
          data: {
            rate: ratePerUnit,
          },
        });
      })
      .filter(Boolean);

    if (updates.length > 0) {
      await prisma.$transaction(updates as any);
      console.log(`[LOG]: Successfully updated ${updates.length} currencies`);
    }
  } catch (error) {
    console.error("[Error]: Failed to update exchange rates:", error);
  }
};

export const initCurrencyCron = () => {
  cron.schedule("0 5 * * *", updateRates, {
    timezone: "Asia/Yekaterinburg",
  });
};
