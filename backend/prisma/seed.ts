import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, DataType } from "../src/generated/prisma/client";
import { cleanValue } from "../src/helpers/cleanValue";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Start seeding...");

  await prisma.categoryAttribute.deleteMany();
  await prisma.category.deleteMany();

  await prisma.manufacturer.createMany({
    data: [{ name: "Wilo" }, { name: "Grandfar" }],
    skipDuplicates: true,
  });
  await prisma.supplier.createMany({
    data: [{ name: "Михалыч" }, { name: "Петрович" }],
    skipDuplicates: true,
  });

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
    include: { attributes: true },
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
    include: { attributes: true },
  });

  const plugs = await prisma.category.create({
    data: {
      name: "Заглушки",
      attributes: {
        create: [
          {
            key: "plugType",
            label: "Тип заглушки",
            unit: "",
            dataType: DataType.STRING,
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
            key: "pn",
            label: "PN (Давление)",
            unit: "бар",
            dataType: DataType.NUMBER,
            isFilterable: true,
          },
          {
            key: "outerDiameter",
            label: "Наружный диаметр",
            unit: "мм",
            dataType: DataType.NUMBER,
            isFilterable: false,
          },
          {
            key: "wallThickness",
            label: "Толщина стенки",
            unit: "мм",
            dataType: DataType.NUMBER,
            isFilterable: false,
          },
          {
            key: "material",
            label: "Материал",
            unit: "",
            dataType: DataType.STRING,
            isFilterable: true,
          },
          {
            key: "standard",
            label: "Стандарт",
            unit: "",
            dataType: DataType.STRING,
            isFilterable: true,
          },
          {
            key: "execution",
            label: "Исполнение",
            unit: "",
            dataType: DataType.STRING,
            isFilterable: false,
          },
        ],
      },
    },
    include: { attributes: true },
  });

  const pumpDnAttr = pumps.attributes.find((a) => a.key === "dn")!;
  const valveMaterialAttr = valves.attributes.find(
    (a) => a.key === "material",
  )!;

  console.log("Seeding NormalizationCache...");

  const cacheData = [
    // Дюймы для насосов (Трубная резьба G)
    {
      attributeId: pumpDnAttr.id,
      rawValue: 'G1½"',
      normalized: {
        valueMin: 40,
        valueMax: 40,
        valueString: '40 мм (G1½")',
      },
    },
    {
      attributeId: pumpDnAttr.id,
      rawValue: '1½"',
      normalized: { valueMin: 32, valueMax: 32, valueString: '32 мм (1½")' },
    },
    // Материалы для задвижек
    {
      attributeId: valveMaterialAttr.id,
      rawValue: "Чугун СЧ20",
      normalized: { valueString: "Чугун" },
    },
    {
      attributeId: valveMaterialAttr.id,
      rawValue: "GG25",
      normalized: { valueString: "Чугун" },
    },
    {
      attributeId: valveMaterialAttr.id,
      rawValue: "Чугун",
      normalized: { valueString: "Чугун" },
    },
  ];

  for (const item of cacheData) {
    await prisma.normalizationCache.create({
      data: {
        attributeId: item.attributeId,
        rawValue: item.rawValue,
        cleanedValue: cleanValue(item.rawValue),
        normalized: item.normalized as any,
      },
    });
  }

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
