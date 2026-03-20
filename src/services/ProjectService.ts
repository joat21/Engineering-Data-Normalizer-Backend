import ExcelJS from "exceljs";
import { prisma } from "../../prisma/prisma";
import { SYSTEM_FIELDS_CONFIG } from "../config";

export const createProject = async (data: {
  name: string;
  description: string;
}) => await prisma.project.create({ data });

export const getProjects = async () => await prisma.project.findMany();

export const getProjectById = async (projectId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      items: {
        include: {
          equipment: true,
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  return {
    ...project,
    items: project.items.map((item) => ({
      id: item.id,
      equipmentId: item.equipmentId,
      amount: item.amount,
      name: item.equipment.name,
      manufacturer: item.equipment.manufacturer,
      article: item.equipment.article,
      model: item.equipment.model,
      externalCode: item.equipment.externalCode,
      price: item.equipment.price,
    })),
  };
};

export const updateProject = async (
  projectId: string,
  data: {
    name?: string;
    description?: string;
    isArchived?: boolean;
  },
) => {
  return await prisma.project.update({
    where: { id: projectId },
    data,
  });
};

export const exportProjectToExcel = async (projectId: string) => {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { items: { include: { equipment: true } } },
  });

  if (!project || project.items.length === 0) {
    throw new Error("Project is empty or not found");
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Оборудование");

  const columns = [
    ...Object.entries(SYSTEM_FIELDS_CONFIG).map(([key, cfg]) => ({
      header: cfg.label,
      key: key,
      width: 20,
    })),
    { header: "Кол-во", key: "amount", width: 10 },
    { header: "Итого", key: "total", width: 15 },
  ];

  worksheet.columns = columns;

  let grandTotal = 0;

  project.items.forEach((item) => {
    const itemPrice = Number(item.equipment.price || 0);
    const rowTotal = item.amount * itemPrice;
    grandTotal += rowTotal;

    const rowData: any = {
      amount: item.amount,
      total: rowTotal === 0 ? "—" : rowTotal.toFixed(2),
    };

    Object.keys(SYSTEM_FIELDS_CONFIG).forEach((key) => {
      const val = (item.equipment as any)[key];
      rowData[key] =
        val === null || val === undefined || val === "" ? "—" : val;
    });

    worksheet.addRow(rowData);
  });

  worksheet.addRow({});
  const totalRow = worksheet.addRow({
    [Object.keys(SYSTEM_FIELDS_CONFIG)[0]]: "ОБЩАЯ СТОИМОСТЬ ПРОЕКТА:",
    total: grandTotal.toFixed(2),
  });

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "F2F2F2" },
  };

  totalRow.font = { bold: true, size: 12 };
  totalRow.getCell("total").alignment = { horizontal: "right" };

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();

  return { projectName: project.name, buffer };
};

export const upsertProjectItem = async (
  projectId: string,
  data: {
    equipmentId: string;
    amount: number;
  },
) => {
  const existingItem = await prisma.projectItem.findUnique({
    where: {
      projectId_equipmentId: {
        projectId: projectId,
        equipmentId: data.equipmentId,
      },
    },
  });

  if (existingItem) {
    return await prisma.projectItem.update({
      where: { id: existingItem.id },
      data: { amount: existingItem.amount + data.amount },
    });
  }

  return await prisma.projectItem.create({
    data: {
      projectId,
      ...data,
    },
  });
};

export const updateItemAmount = async (itemId: string, amount: number) => {
  return await prisma.projectItem.update({
    where: { id: itemId },
    data: { amount },
  });
};

export const deleteProjectItem = async (itemId: string) => {
  return await prisma.projectItem.delete({
    where: { id: itemId },
  });
};
