import { faqs } from "@/lib/data";
export function FAQAccordion({ categories = Object.keys(faqs) }) {
    return (<div className="faq">
      {categories.map((category) => (<section key={category}>
          <h2 className="heading" style={{ fontSize: "clamp(32px, 4vw, 56px)" }}>{category}</h2>
          {(faqs[category] ?? []).map(([question, answer]) => (<details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>))}
        </section>))}
    </div>);
}
