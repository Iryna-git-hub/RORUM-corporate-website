const endpointPlaceholder = "https://formspree.io/f/FORM_ID_PLACEHOLDER";

export const formspreeConfig = {
  endpoint:
    process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT?.trim() || endpointPlaceholder,
};

export function isFormspreeConfigured(): boolean {
  return formspreeConfig.endpoint !== endpointPlaceholder;
}

export async function submitToFormspree(formData: FormData): Promise<void> {
  if (!isFormspreeConfigured()) {
    throw new Error("FORMSPREE_NOT_CONFIGURED");
  }

  const response = await fetch(formspreeConfig.endpoint, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: formData,
  });

  if (!response.ok) {
    throw new Error("FORMSPREE_SUBMISSION_FAILED");
  }
}
