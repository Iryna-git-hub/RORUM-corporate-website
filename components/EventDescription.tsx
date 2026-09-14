import { RichText } from "@/components/RichText";

function plainParagraphs(value: string): string[] {
  return value
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function EventDescription({ formatted, plain }: { formatted?: unknown[]; plain: string }) {
  const hasFormattedContent = Array.isArray(formatted) && formatted.length > 0;

  return (
    <div className="event-description grid max-w-[68ch] gap-4 text-[17px] leading-[1.75] text-text-primary [&_a]:text-dark-green [&_a]:underline [&_a]:underline-offset-3 [&_h2]:m-0 [&_h2]:font-heading [&_h2]:text-[1.3em] [&_h2]:font-semibold [&_li]:pl-1 [&_ol]:m-0 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:m-0 [&_strong]:font-bold [&_ul]:m-0 [&_ul]:list-disc [&_ul]:pl-6">
      {hasFormattedContent ? (
        <RichText value={formatted} />
      ) : (
        plainParagraphs(plain).map((paragraph, index) => (
          <p className="whitespace-pre-line" key={`${index}-${paragraph.slice(0, 24)}`}>
            {paragraph}
          </p>
        ))
      )}
    </div>
  );
}
