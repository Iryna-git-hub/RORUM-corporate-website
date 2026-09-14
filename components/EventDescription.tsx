import { RichText } from "@/components/RichText";

export function EventDescription({ formatted }: { formatted?: unknown[] }) {
  return (
    <div className="event-description grid max-w-[68ch] gap-4 text-[17px] leading-[1.75] text-text-primary [&_a]:text-dark-green [&_a]:underline [&_a]:underline-offset-3 [&_h2]:m-0 [&_h2]:font-heading [&_h2]:text-[1.3em] [&_h2]:font-semibold [&_li]:pl-1 [&_ol]:m-0 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:m-0 [&_strong]:font-bold [&_ul]:m-0 [&_ul]:list-disc [&_ul]:pl-6">
      <RichText value={formatted ?? []} />
    </div>
  );
}
