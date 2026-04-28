import type { PropsWithChildren } from "react";

interface SectionProps extends PropsWithChildren {
  title: string;
}

export const Section = ({ title, children }: SectionProps) => {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[22px] font-semibold">{title}</h2>
      {children}
    </section>
  );
};
