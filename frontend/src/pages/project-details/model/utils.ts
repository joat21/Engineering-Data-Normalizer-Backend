import { toast } from "@heroui/react";
import { exportToExcel } from "@/entities/project";
import { formatNumber } from "@/shared/lib";

export const downloadExcel = async (projectId: string, projectName: string) => {
  try {
    const response = await exportToExcel({ id: projectId });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;

    const contentDisposition = response.headers["content-disposition"];
    let fileName = `${projectName}.xlsx`;

    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) fileName = match[1];
    }

    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();

    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Ошибка при скачивании файла", error);
    toast.danger("Произошла ошибка. Попробуйте повторить попытку позже");
  }
};

export const formatPrice = (
  price: string | number | null,
  currencyCode?: string,
) => {
  if (!price) return "0";

  const num = typeof price === "string" ? parseFloat(price) : price;

  if (currencyCode) {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
    }).format(num);
  }

  return formatNumber(num);
};
