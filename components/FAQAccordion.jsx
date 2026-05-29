"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { faqs } from "@/lib/data";

export function FAQAccordion({ categories = Object.keys(faqs) }) {
  const [openItem, setOpenItem] = useState(null);

  return (
    <div className="faq">
      {categories.map((category) => (
        <section key={category}>
          <h2 className="heading faq-category-title">{category}</h2>
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
