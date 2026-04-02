import { Spinner } from "@heroui/react";

export const PageLoader = () => (
  <div className="flex flex-col gap-4 items-center justify-center min-h-100 h-full w-full">
    <Spinner size="lg" />
    <p className="text-default-500 animate-pulse">Пожалуйста, подождите...</p>
  </div>
);
