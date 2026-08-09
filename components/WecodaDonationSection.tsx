"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, Copy, Landmark } from "lucide-react";
import { Container, SectionLabel } from "@/components/ui";

interface BankField {
  label: string;
  value: string;
  copyable?: boolean;
}

const bankFields: BankField[] = [
  {
    label: "Beneficiary",
    value: "Women Entrepreneurs Commerce & Development Association (WECODA)",
  },
  { label: "CVR", value: "46365208" },
  { label: "Bank", value: "Danske Bank" },
  { label: "Account Type", value: "Danske Direkte Forening" },
  { label: "Account No.", value: "14165789", copyable: true },
  { label: "Reg. No.", value: "9570" },
  { label: "IBAN", value: "DK96 3000 0014 1657 89", copyable: true },
  { label: "SWIFT/BIC", value: "DABADKKK" },
  { label: "Currency", value: "DKK (Danish Krone)" },
];

function CopyButton({
  label,
  value,
  isCopied,
  onCopy,
}: {
  label: string;
  value: string;
  isCopied: boolean;
  onCopy: (label: string, value: string) => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.25 shrink-0 py-1.25 px-2.5 rounded-pill bg-white text-red text-[0.72rem] font-semibold cursor-pointer transition-[background,color,border-color] duration-160 ease-[ease] hover:bg-red hover:border-red hover:text-white focus-visible:outline-1 focus-visible:outline-[rgba(var(--rgb-red),0.45)] focus-visible:outline-offset-[3px]"
      onClick={() => onCopy(label, value)}
      aria-label={isCopied ? `${label} copied` : `Copy ${label}`}
    >
      {isCopied ? (
        <Check size={14} aria-hidden="true" strokeWidth={2} />
      ) : (
        <Copy size={14} aria-hidden="true" strokeWidth={1.9} />
      )}
      <span aria-live="polite">{isCopied ? "Copied" : "Copy"}</span>
    </button>
  );
}

export function WecodaDonationSection({ qrSrc }: { qrSrc: string }) {
  const [bankOpen, setBankOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API unavailable — the value remains visible for manual copy.
    }
    setCopiedField(label);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <section
      id="support-wecoda"
      className="scroll-mt-[78px] bg-white py-[clamp(44px,6vw,6rem)]"
    >
      <Container>
        <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-[clamp(32px,5vw,64px)] max-lg:gap-8 items-start">
          <div className="grid gap-[18px] min-w-0">
            <SectionLabel>Donation</SectionLabel>
            <h2 className="font-heading font-medium leading-tight tracking-[-0.03em] text-text-primary m-0 text-[clamp(1.7rem,2.6vw,2.15rem)]">
              Support the WECODA Community
            </h2>
            <p className="m-0 max-w-[52ch] text-text-primary text-base leading-[1.62]">
              Your support helps WECODA organise educational programmes,
              community events, international collaborations, and new
              opportunities for women.
            </p>

            <div className="grid justify-items-center gap-1 max-w-full mt-[6px] p-[clamp(24px,3vw,32px)] bg-white max-sm:w-full max-sm:max-w-[420px] max-sm:mx-auto">
              <div className="grid place-items-center w-[clamp(160px,16vw,190px)] aspect-square mb-3">
                <Image
                  src={qrSrc}
                  alt="QR code for supporting WECODA"
                  width={800}
                  height={800}
                  className="h-full w-full object-contain"
                />
              </div>
              <p className="m-0 text-red font-bold text-base">Scan to donate</p>
              <p className="m-0 text-[rgba(var(--rgb-dark-brown),0.6)] text-[0.82rem]">
                Fast, secure and easy.
              </p>
            </div>

            <div
              className="flex items-center gap-3.5 w-full mt-2.5 text-[rgba(var(--rgb-dark-brown),0.45)] text-[0.72rem] font-bold tracking-[0.1em] before:content-[''] before:flex-1 before:h-px before:bg-[rgba(var(--rgb-brown),0.18)] after:content-[''] after:flex-1 after:h-px after:bg-[rgba(var(--rgb-brown),0.18)]"
              role="separator"
            >
              <span>OR</span>
            </div>

            <p className="flex items-center justify-center gap-[10px] mx-auto my-0 text-text-primary text-base leading-[1.55] text-center max-lg:hidden">
              <Landmark
                size={18}
                aria-hidden="true"
                strokeWidth={1.8}
                className="shrink-0 w-[30px] h-[30px] text-red"
              />
              Prefer bank transfer? See our bank details on the right.
            </p>
          </div>

          <div className="min-w-0">
            <div className="w-full p-[clamp(26px,3vw,36px)] bg-cream max-sm:p-[clamp(22px,5vw,28px)]">
              <button
                type="button"
                className="flex items-center justify-between gap-3 w-full m-0 p-0 border-0 bg-transparent text-inherit [font:inherit] text-left cursor-default max-lg:cursor-pointer focus-visible:outline-1 focus-visible:outline-[rgba(var(--rgb-red),0.45)] focus-visible:outline-offset-4"
                aria-expanded={bankOpen}
                aria-controls="wecoda-bank-panel"
                onClick={() => setBankOpen((open) => !open)}
              >
                <span className="font-heading font-medium leading-tight tracking-[-0.03em] text-text-primary m-0 text-[clamp(1.3rem,2vw,1.5rem)]">
                  Bank Details
                </span>
                <ChevronDown
                  className={`hidden shrink-0 text-red transition-transform duration-300 ease-[ease] max-lg:block ${bankOpen ? "rotate-180" : ""}`}
                  size={20}
                  aria-hidden="true"
                  strokeWidth={1.8}
                />
              </button>
              <div
                className={`mt-5 max-lg:overflow-hidden max-lg:[transition:max-height_0.42s_cubic-bezier(0.22,1,0.36,1),opacity_0.3s_ease,margin-top_0.3s_ease] ${
                  bankOpen
                    ? "max-lg:max-h-[900px] max-lg:mt-5 max-lg:opacity-100"
                    : "max-lg:max-h-0 max-lg:mt-0 max-lg:opacity-0"
                }`}
                id="wecoda-bank-panel"
              >
                <div>
                  <dl className="m-0 grid">
                    {bankFields.map((field) => (
                      <div
                        className="grid grid-cols-[minmax(110px,0.8fr)_minmax(0,1.4fr)] gap-4 items-start py-2.5 border-b border-b-[rgba(var(--rgb-brown),0.16)] last:border-b-0 last:pb-0 first:pt-0"
                        key={field.label}
                      >
                        <dt className="m-0 text-[rgba(var(--rgb-dark-brown),0.58)] text-[0.76rem] font-semibold uppercase tracking-[0.04em]">
                          {field.label}
                        </dt>
                        <dd className="flex items-center justify-between gap-2.5 m-0 text-text-primary text-base font-semibold leading-[1.4] break-words">
                          <span>{field.value}</span>
                          {field.copyable ? (
                            <CopyButton
                              label={field.label}
                              value={field.value}
                              isCopied={copiedField === field.label}
                              onCopy={handleCopy}
                            />
                          ) : null}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>

            <p className="mt-[clamp(32px,4vw,48px)] mx-0 mb-0 max-w-[68ch] pl-4 border-l-[3px] border-red text-[rgba(var(--rgb-dark-brown),0.68)] text-[0.9rem] leading-[1.55]">
              RORUM proudly supports WECODA by providing a welcoming space for
              community events, learning, and collaboration.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
