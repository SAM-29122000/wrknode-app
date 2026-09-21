// Single source of truth for how the job-agent describes the candidate to
// the AI matching/drafting prompts and in outgoing application emails.
//
// IMPORTANT: this is deliberately the version backed by the actual resume
// PDF the candidate provided (Operations Executive at My Tasker, CRM/ops
// for UK-US clients) — not the "Purchase Executive for Bauhaus, sourcing
// from China" story described verbally but never confirmed against a real
// document. If that story is actually accurate, update BOTH this file and
// the resume PDF together so the two never contradict each other in front
// of a real employer.
export const CANDIDATE_NAME = "Santanu Chatterjee";
export const CANDIDATE_EMAIL = "santanu.chatterjee04ce@gmail.com";

export const CANDIDATE_SUMMARY = `Santanu Chatterjee — Operations Executive at My Tasker Virtual Assistant Pvt Ltd (Dec 2025-present), managing end-to-end operations, CRM workflows, and outsourcing processes for UK and US clients using ERP, SAP, and business process management systems across real estate and operational domains. Prior roles (May-Dec 2025, Surya International Enterprise/Surya International Pvt Ltd) in EPC procurement and supply chain: Purchase Requisitions/Purchase Orders, SAP S/4HANA and SAP Ariba, vendor development, RFQ management, contract negotiation, and inventory/material planning across 12+ EPC and infrastructure projects in India, including WTP/STP/ETP work with INCOTERMS-compliant logistics coordination. B.Tech Civil Engineering (2025).`;
