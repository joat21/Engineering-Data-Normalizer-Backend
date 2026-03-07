import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, DataType } from "../src/generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Start seeding...");

  await prisma.categoryAttribute.deleteMany();
  await prisma.category.deleteMany();

  const pumps = await prisma.category.create({
    data: {
      name: "Насосы",
      attributes: {
        create: [
          {
            key: "power",
            label: "Мощность",
            unit: "кВт",
            dataType: DataType.NUMBER,
            isFilterable: true,
          },
          {
            key: "phases",
            label: "Количество фаз",
            unit: "",
            dataType: DataType.NUMBER,
            isFilterable: true,
          },
          {
            key: "voltage",
            label: "Напряжение",
            unit: "В",
            dataType: DataType.NUMBER,
            isFilterable: true,
          },
          {
            key: "frequency",
            label: "Частота",
            unit: "Гц",
            dataType: DataType.NUMBER,
            isFilterable: true,
          },
          {
            key: "maxHead",
            label: "Максимальный напор",
            unit: "м",
            dataType: DataType.NUMBER,
            isFilterable: true,
          },
          {
            key: "maxFlow",
            label: "Максимальная производительность",
            unit: "м³/ч",
            dataType: DataType.NUMBER,
            isFilterable: true,
          },
          {
            key: "dn",
            label: "DN (Диаметр)",
            unit: "мм",
            dataType: DataType.NUMBER,
            isFilterable: true,
          },
          {
            key: "pumpType",
            label: "Тип насоса",
            unit: "",
            dataType: DataType.STRING,
            isFilterable: true,
          },
        ],
      },
    },
  });

  const valves = await prisma.category.create({
    data: {
      name: "Задвижки",
      attributes: {
        create: [
          {
            key: "dn",
            label: "DN (Диаметр)",
            unit: "мм",
            dataType: DataType.NUMBER,
            isFilterable: true,
          },
          {
            key: "pn",
            label: "PN (Давление)",
            unit: "бар",
            dataType: DataType.NUMBER,
            isFilterable: true,
          },
          {
            key: "material",
            label: "Материал корпуса",
            unit: "",
            dataType: DataType.STRING,
            isFilterable: true,
          },
          {
            key: "connectionType",
            label: "Тип присоединения",
            unit: "",
            dataType: DataType.STRING,
            isFilterable: true,
          },
          {
            key: "maxTemp",
            label: "Макс. рабочая температура",
            unit: "°C",
            dataType: DataType.NUMBER,
            isFilterable: false,
          },
        ],
      },
    },
  });

  console.log({ pumps, valves });
  console.log("Seeding finished");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
