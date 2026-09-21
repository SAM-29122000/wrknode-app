import { RESUME_FILENAME, RESUME_MIME_TYPE, RESUME_PDF_BASE64 } from "./resumeAttachment";
import { CANDIDATE_EMAIL, CANDIDATE_NAME } from "./resumeProfile";

// All Gmail access here is plain REST + OAuth2 refresh-token exchange — no
// googleapis SDK dependency. Setup: create an OAuth client in Google Cloud
// Console (Desktop app type is simplest), then mint a refresh token once
// via https://developers.google.com/oauthplayground using your own
// client ID/secret and the gmail.send + gmail.readonly scopes. Paste the
// three values into GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET /
// GMAIL_REFRESH_TOKEN.

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Gmail OAuth env vars are not fully set");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error(`Gmail token refresh failed: ${res.status} ${await res.text().catch(() => "")}`);
  }

  const data = await res.json();
  return data.access_token;
}

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildMimeMessage({ to, subject, body }: { to: string; subject: string; body: string }) {
  const boundary = "wrknode_job_agent_boundary";
  const lines = [
    `From: ${CANDIDATE_NAME} <${CANDIDATE_EMAIL}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    body,
    "",
    `--${boundary}`,
    `Content-Type: ${RESUME_MIME_TYPE}; name="${RESUME_FILENAME}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${RESUME_FILENAME}"`,
    "",
    RESUME_PDF_BASE64.replace(/(.{76})/g, "$1\n"),
    "",
    `--${boundary}--`,
  ];
  return lines.join("\r\n");
}

export async function sendApplicationEmail(to: string, subject: string, body: string) {
  const accessToken = await getAccessToken();
  const raw = base64UrlEncode(buildMimeMessage({ to, subject, body }));

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    throw new Error(`Gmail send failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
}

function findHeader(headers: { name: string; value: string }[], name: string) {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function extractPlainText(payload: any): string {
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  for (const part of payload.parts ?? []) {
    const text = extractPlainText(part);
    if (text) return text;
  }
  return "";
}

export async function listRecentInboxMessages(query: string) {
  const accessToken = await getAccessToken();
  const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  url.searchParams.set("q", query);
  url.searchParams.set("maxResults", "20");

  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) {
    throw new Error(`Gmail list failed: ${res.status} ${await res.text().catch(() => "")}`);
  }
  const data = await res.json();
  const ids: string[] = (data.messages ?? []).map((m: any) => m.id);

  const messages = await Promise.all(
    ids.map(async (id) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!msgRes.ok) return null;
      const msg = await msgRes.json();
      const headers = msg.payload?.headers ?? [];
      return {
        id: msg.id as string,
        subject: findHeader(headers, "Subject"),
        from: findHeader(headers, "From"),
        snippet: msg.snippet as string,
        body: extractPlainText(msg.payload) || (msg.snippet as string) || "",
      };
    })
  );

  return messages.filter((m): m is NonNullable<typeof m> => m !== null);
}
