import {
  cn,
  Modal,
  type ModalHeaderProps as HeroModalHeaderProps,
} from "@heroui/react";

interface ModalHeaderProps extends HeroModalHeaderProps {
  title: string;
  columnName: string;
  icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
}

export const ModalHeader = ({
  title,
  columnName,
  className,
  icon: Icon,
  ...props
}: ModalHeaderProps) => {
  return (
    <Modal.Header className={cn("mb-2", className)} {...props}>
      <div className="flex items-center gap-2 text-primary">
        <Icon width={24} height={24} />
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <p>
        Колонка: <span className="font-semibold">{columnName}</span>
      </p>
    </Modal.Header>
  );
};
