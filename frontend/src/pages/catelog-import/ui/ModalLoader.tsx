import { Spinner } from "@heroui/react";

interface ModalLoaderProps {
  isLoading: boolean;
}

export const ModalLoader = ({ isLoading }: ModalLoaderProps) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-100 flex items-center justify-center bg-white/60 backdrop-blur-[1px] transition-all">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <span className="text-sm font-medium animate-pulse">
          Пожалуйста, подождите...
        </span>
      </div>
    </div>
  );
};
