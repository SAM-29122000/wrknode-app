import { CANDIDATE_EMAIL, CANDIDATE_NAME, CANDIDATE_SUMMARY } from "./resumeProfile";

// Uses Google's free-tier Gemini API (no billing required, unlike
// OpenAI) — the same provider already used by the wrknode landing page's
// n8n lead-reply workflow. Every caller below passes exactly one system
// message and one user message, so this only needs to support that shape.
async function chatCompletion(messages: { role: string; content: string }[], temperature: number) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const systemMessage = messages.find((m) => m.role === "system")?.content;
  const userMessage = messages.find((m) => m.role === "user")?.content ?? "";
  // An alias, not a pinned version — Google has deprecated specific
  // dated/numbered models twice just while building this integration
  // ("no longer available to new users"). Aliases keep pointing at
  // whatever's current instead of breaking on the next deprecation.
  const model = process.env.GEMINI_MODEL ?? "gemini-flash-lite-latest";

  const body = JSON.stringify({
    ...(systemMessage ? { systemInstruction: { parts: [{ text: systemMessage }] } } : {}),
    contents: [{ role: "user", parts: [{ text: userMessage }] }],
    generationConfig: { temperature },
  });
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Gemini's free tier genuinely returns transient 503 "high demand"
  // errors under normal use (observed live, not hypothetical) — retry
  // those a couple of times with backoff rather than fail the whole
  // discover run over one flaky call.
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body });

    if (res.ok) {
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }

    lastError = `Gemini request failed: ${res.status} ${await res.text().catch(() => "")}`;
    if (res.status !== 503 || attempt === 2) break;
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
  }

  throw new Error(lastError);
}

function parseJsonLoose<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch {
    return fallback;
  }
}

export async function scoreJobMatch(job: { title: string; company: string | null; description: string }) {
  const raw = await chatCompletion(
    [
      {
        role: "system",
        content:
          "You are a strict resume-to-job matching engine. You NEVER invent or exaggerate experience. You score fit honestly (0-100) and suggest only truthful emphasis changes based on the candidate's real, existing experience.",
      },
      {
        role: "user",
        content: `CANDIDATE RESUME SUMMARY:\n${CANDIDATE_SUMMARY}\n\nJOB POSTING:\nTitle: ${job.title}\nCompany: ${job.company ?? "unknown"}\nDescription: ${job.description}\n\nReturn ONLY valid JSON, no markdown fences:\n{"score": 0-100, "reasoning": "one honest sentence", "suggested_emphasis": "which of the candidate's REAL skills to lead with for this job, no fabrication"}`,
      },
    ],
    0.2
  );

  return parseJsonLoose(raw, { score: 0, reasoning: "parse_error", suggested_emphasis: "" });
}

export async function draftApplicationEmail(job: { title: string; company: string | null }, emphasis: string) {
  return chatCompletion(
    [
      {
        role: "system",
        content:
          "You write short, honest, professional cold application emails. Never invent facts not present in the candidate summary provided.",
      },
      {
        role: "user",
        content: `Write a concise 120-150 word application email for this candidate applying to "${job.title}" at ${job.company ?? "this company"}. Emphasize: ${emphasis}. Candidate: ${CANDIDATE_SUMMARY} Contact email: ${CANDIDATE_EMAIL}. Sign off as ${CANDIDATE_NAME}. Output plain email text only, no subject line.`,
      },
    ],
    0.4
  );
}

export async function classifyReply(email: { subject: string; from: string; body: string }) {
  const raw = await chatCompletion(
    [
      {
        role: "system",
        content:
          "You classify emails for a job seeker. Determine if an email is a genuine reply related to a job application (interview invite, recruiter response, rejection, assessment link, offer) versus an unrelated email (newsletter, spam, personal, unrelated notification).",
      },
      {
        role: "user",
        content: `Subject: ${email.subject}\nFrom: ${email.from}\nBody: ${email.body.slice(0, 2000)}\n\nReturn ONLY JSON, no markdown: {"is_job_related": true/false, "category": "interview_invite|rejection|recruiter_followup|assessment|offer|other_job_related|not_job_related", "summary": "one short sentence a person can read on their phone"}`,
      },
    ],
    0.1
  );

  return parseJsonLoose(raw, { is_job_related: false, category: "not_job_related", summary: "" });
}
