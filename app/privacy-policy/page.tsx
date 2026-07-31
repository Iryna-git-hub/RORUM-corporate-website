import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { PrivacyPolicyContent } from "@/components/PrivacyPolicyContent";

export const metadata: Metadata = {
  title: "Privacy Policy | RORUM",
  description:
    "How RORUM handles personal information submitted through this website.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      subtitle="How RORUM handles personal information submitted through this website."
    >
      <PrivacyPolicyContent />
    </LegalPage>
  );
}
