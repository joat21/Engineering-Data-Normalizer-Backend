import { prisma } from "../../prisma";

export const recalculateEquipmentPrices = async () => {
  console.log(
    `[${new Date().toISOString()}] [LOG]: Global price recalculation started`,
  );
  const startTime = Date.now();

  try {
    const updatedCount = await prisma.$executeRaw`
      UPDATE "Equipment" e
      SET "priceInRub" = e.price * c.rate
      FROM "Currency" c
      WHERE e."currencyId" = c.id
        AND e.price IS NOT NULL;
    `;

    const duration = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] [LOG]: Recalculated prices for ${updatedCount} items in ${duration}ms`,
    );
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [Error]: Global price recalculation failed:`,
      error,
    );
  }
};
