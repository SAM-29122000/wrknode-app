import { CANDIDATE_EMAIL, CANDIDATE_NAME, CANDIDATE_SUMMARY } from "./resumeProfile";

async function chatCompletion(messages: { role: string; content: string }[], temperature: number) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages,
      temperature,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI request failed: ${res.status} ${await res.text().catch(() => "")}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
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
