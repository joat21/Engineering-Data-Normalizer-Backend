import { prisma } from "../../prisma/prisma";

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
