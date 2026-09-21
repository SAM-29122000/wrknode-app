import type { ResumeVariantKey } from "./resumeAttachments";

// Simple keyword routing on the AI's honest "suggested_emphasis" field
// (see ai.ts) — this picks which of the three already-written, honest
// resume variants to attach, it does not generate new resume content
// per job. Defaults to PROCUREMENT, the closest match to the confirmed
// current role.
export function selectResumeVariant(emphasis: string): ResumeVariantKey {
  const text = emphasis.toLowerCase();

  if (/\b(sap|erp|s\/4hana|ariba|mm module)\b/.test(text)) {
    return "SAP_ERP";
  }
  if (/\b(logistics|import|export|incoterms|freight|shipment|inspection|china|customs)\b/.test(text)) {
    return "LOGISTICS";
  }
  return "PROCUREMENT";
}
