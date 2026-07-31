"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { faqs } from "@/lib/data";

export function FAQAccordion({
  categories = Object.keys(faqs),
}: {
  categories?: string[];
}) {
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <div className="grid gap-17.5 max-[980px]:gap-10.5">
      {categories.map((category) => (
        <section className="grid gap-0" key={category}>
          <h2 className="mb-3 text-red font-body text-[clamp(15px,1.4vw,18px)] leading-tight font-black tracking-[0.03em]">
            {category}
          </h2>
          {(faqs[category] ?? []).map(([question, answer]) => {
            const id = `${category}-${question}`;
            const isOpen = openItem === id;

            return (
              <article className={isOpen ? "faq-item is-open" : "faq-item"} key={id}>
                <button
                  className="faq-question"
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenItem(isOpen ? null : id)}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                    <ChevronRight size={16} aria-hidden="true" />
                    <span>{question}</span>
                  </span>
                </button>
                <div className="faq-answer">
                  <div>
                    <p>{answer}</p>
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
