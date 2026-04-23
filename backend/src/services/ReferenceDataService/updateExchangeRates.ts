import axios from "axios";
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

export const updateExchangeRates = async () => {
  try {
    console.log(
      `[${new Date().toISOString()}] [LOG]: Updating exchange rates started`,
    );
    const startTime = Date.now();

    const { data } = await axios.get<ExchangeRatesResponse>(
      process.env.EXCHANGE_RATES_URL ?? "",
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
      const duration = Date.now() - startTime;
      console.log(
        `[${new Date().toISOString()}] [LOG]: Successfully updated ${updates.length} currencies in ${duration}ms`,
      );
    }
  } catch (error) {
    console.error("[Error]: Failed to update exchange rates:", error);
  }
};
