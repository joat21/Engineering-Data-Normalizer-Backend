import {
  cn,
  Modal,
  type ModalBodyProps as HeroModalBodyProps,
} from "@heroui/react";

interface ModalBodyProps extends HeroModalBodyProps {}

export const ModalBody = ({
  className,
  children,
  ...props
}: ModalBodyProps) => {
  return (
    <Modal.Body
      className={cn(
        "flex flex-col gap-3 text-lg text-default-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </Modal.Body>
  );
};
