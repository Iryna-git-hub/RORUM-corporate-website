"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { faqs } from "@/lib/data";

export interface FaqGroupData {
  title: string;
  items: { question: string; answer: string }[];
}

const staticGroups: FaqGroupData[] = Object.entries(faqs).map(([title, entries]) => ({
  title,
  items: entries.map(([question, answer]) => ({ question, answer })),
}));

export function FAQAccordion({ groups = staticGroups }: { groups?: FaqGroupData[] }) {
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <div className="grid gap-17.5 max-lg:gap-10.5">
      {groups.map(({ title, items }) => (
        <section className="grid gap-0" key={title}>
          <h2 className="mb-3 text-red font-body text-[clamp(15px,1.4vw,18px)] leading-tight font-black tracking-[0.03em]">
            {title}
          </h2>
          {items.map(({ question, answer }) => {
            const id = `${title}-${question}`;
            const isOpen = openItem === id;

            return (
              // `faq-item`/`is-open`, `faq-question` (its ::before/::after
              // build the circular plus/minus icon) and `faq-answer` (the
              // max-height/opacity/transform expand transition) stay
              // hand-authored CSS - a complex animation, per this project's
              // established allowance - everything else here is Tailwind.
              <article
                className={`faq-item border-t border-t-[rgba(var(--rgb-beige),0.86)] bg-transparent last:border-b last:border-b-[rgba(var(--rgb-beige),0.86)] ${isOpen ? "is-open" : ""}`.trim()}
                key={id}
              >
                <button
                  className="faq-question relative grid grid-cols-[minmax(0,1fr)_34px] gap-4.5 items-center w-full cursor-pointer py-3.75 px-0 border-0 bg-transparent text-text-primary font-black text-left max-lg:grid-cols-[minmax(0,1fr)_30px] max-lg:gap-3.5 max-lg:py-3.5"
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenItem(isOpen ? null : id)}
                >
                  <span className="inline-flex items-center gap-2">
                    <ChevronRight
                      size={16}
                      className="shrink-0 text-red"
                      aria-hidden="true"
                    />
                    <span>{question}</span>
                  </span>
                </button>
                <div className="faq-answer">
                  <div className="overflow-hidden">
                    <p className="m-0 pr-12 pb-5 max-lg:pr-0 text-text-primary leading-[1.65]">
                      {answer}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}
