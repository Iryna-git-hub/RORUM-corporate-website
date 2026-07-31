import type { ReactNode } from "react";
import { Container, SectionLabel } from "@/components/ui";

export function LegalPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <>
      <section className="bg-secondary pt-[65px] pb-[clamp(28px,5vw,52px)] px-0">
        <Container>
          <div className="max-w-[860px]">
            <SectionLabel>LEGAL</SectionLabel>
            <h1 className="font-heading font-medium tracking-[-0.03em] text-text-primary mx-0 mt-[14px] mb-[18px] text-[36px] leading-[1.08]">
              {title}
            </h1>
            <p className="max-w-[720px] m-0 text-text-primary text-base leading-[1.65]">
              {subtitle}
            </p>
            <p className="mx-0 mt-[16px] mb-0 text-light-green text-[0.9rem] font-bold">
              Last updated: May 2026
            </p>
          </div>
        </Container>
      </section>
      <section className="pt-[clamp(28px,5vw,56px)] pb-[clamp(52px,8vw,104px)] px-0">
        <Container>
          <div className="policy-content">{children}</div>
        </Container>
      </section>
    </>
  );
}
