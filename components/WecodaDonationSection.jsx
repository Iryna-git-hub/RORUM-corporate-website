"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, ChevronDown, Copy, Landmark } from "lucide-react";
import { Container, SectionLabel } from "@/components/ui";

const bankFields = [
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

function CopyButton({ label, value, isCopied, onCopy }) {
  return (
    <button
      type="button"
      className="wecoda-bank-copy-btn"
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

export function WecodaDonationSection({ qrSrc }) {
  const [bankOpen, setBankOpen] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleCopy = async (label, value) => {
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
    <section id="support-wecoda" className="section wecoda-donation-section">
      <Container>
        <div className="wecoda-donation-grid">
          <div className="wecoda-donation-left">
            <SectionLabel>Donation</SectionLabel>
            <h2 className="heading wecoda-donation-heading">
              Support the WECODA Community
            </h2>
            <p className="wecoda-donation-lead">
              Your support helps WECODA organise educational programmes,
              community events, international collaborations, and new
              opportunities for women.
            </p>

            <div className="wecoda-donation-qr-card">
              <div className="wecoda-donation-qr-frame">
                <Image
                  src={qrSrc}
                  alt="QR code for supporting WECODA"
                  width={800}
                  height={800}
                />
              </div>
              <p className="wecoda-donation-scan-accent">Scan to donate</p>
              <p className="wecoda-donation-scan-note">
                Fast, secure and easy.
              </p>
            </div>

            <div className="wecoda-donation-divider" role="separator">
              <span>OR</span>
            </div>

            <p className="wecoda-donation-transfer-prompt">
              <Landmark size={18} aria-hidden="true" strokeWidth={1.8} />
              Prefer bank transfer? See our bank details on the right.
            </p>
          </div>

          <div className="wecoda-donation-right">
            <div className={`wecoda-bank-card ${bankOpen ? "is-open" : ""}`}>
              <button
                type="button"
                className="wecoda-bank-card-toggle"
                aria-expanded={bankOpen}
                aria-controls="wecoda-bank-panel"
                onClick={() => setBankOpen((open) => !open)}
              >
                <span className="heading wecoda-bank-card-title">
                  Bank Details
                </span>
                <ChevronDown
                  className="wecoda-bank-card-chevron"
                  size={20}
                  aria-hidden="true"
                  strokeWidth={1.8}
                />
              </button>
              <div className="wecoda-bank-card-panel" id="wecoda-bank-panel">
                <div className="wecoda-bank-card-panel-inner">
                  <dl className="wecoda-bank-list">
                    {bankFields.map((field) => (
                      <div className="wecoda-bank-row" key={field.label}>
                        <dt>{field.label}</dt>
                        <dd>
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

            <p className="wecoda-donation-note">
              RORUM proudly supports WECODA by providing a welcoming space for
              community events, learning, and collaboration.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
