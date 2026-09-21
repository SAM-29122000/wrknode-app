export type RawJobListing = {
  sourceId: string;
  source: "adzuna" | "jooble";
  title: string;
  company: string | null;
  location: string | null;
  description: string;
  url: string;
};

const SEARCH_TERMS =
  process.env.JOB_AGENT_SEARCH_TERMS ??
  "operations executive OR procurement OR SAP OR supply chain OR CRM operations";

export async function fetchAdzunaListings(): Promise<RawJobListing[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  const country = process.env.ADZUNA_COUNTRY ?? "in";
  if (!appId || !appKey) return [];

  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", "50");
  url.searchParams.set("what", SEARCH_TERMS);
  url.searchParams.set("content-type", "application/json");

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error("Adzuna fetch failed:", res.status, await res.text().catch(() => ""));
    return [];
  }
  const data = await res.json();

  return (data.results ?? []).map((r: any) => ({
    sourceId: `adzuna_${r.id}`,
    source: "adzuna" as const,
    title: r.title,
    company: r.company?.display_name ?? null,
    location: r.location?.display_name ?? null,
    description: String(r.description ?? "").replace(/\s+/g, " ").trim(),
    url: r.redirect_url,
  }));
}

export async function fetchJoobleListings(): Promise<RawJobListing[]> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(`https://jooble.org/api/${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords: SEARCH_TERMS, location: process.env.JOOBLE_LOCATION ?? "" }),
  });
  if (!res.ok) {
    console.error("Jooble fetch failed:", res.status, await res.text().catch(() => ""));
    return [];
  }
  const data = await res.json();

  return (data.jobs ?? []).map((r: any) => ({
    sourceId: `jooble_${r.id ?? Buffer.from(r.link ?? r.title ?? "").toString("base64").slice(0, 24)}`,
    source: "jooble" as const,
    title: r.title,
    company: r.company ?? null,
    location: r.location ?? null,
    description: String(r.snippet ?? "").replace(/\s+/g, " ").trim(),
    url: r.link,
  }));
}

export async function fetchAllListings(): Promise<RawJobListing[]> {
  const [adzuna, jooble] = await Promise.all([fetchAdzunaListings(), fetchJoobleListings()]);
  return [...adzuna, ...jooble];
}
