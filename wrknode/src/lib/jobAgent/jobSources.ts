export type RawJobListing = {
  sourceId: string;
  source: "adzuna" | "jooble";
  title: string;
  company: string | null;
  location: string | null;
  description: string;
  url: string;
};

// Adzuna (and Jooble) treat "what"/"keywords" as a literal phrase/AND
// search, NOT boolean OR — "purchase engineer OR procurement" narrows
// results to postings containing all those words, the opposite of what
// you'd expect. So this is a list of separate phrases, each queried on
// its own and merged, not one OR'd string.
const SEARCH_PHRASES = (
  process.env.JOB_AGENT_SEARCH_TERMS ??
  "purchase engineer,procurement SAP,supply chain logistics,import export,remote purchase,startup procurement,graduate procurement,junior procurement,junior purchase"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Adzuna needs a separate API call per country. Each phrase also needs
// its own call (no OR support — see above), so total calls per run =
// countries x phrases. Keep both lists short on a free API tier.
const ADZUNA_COUNTRIES = (process.env.ADZUNA_COUNTRIES ?? process.env.ADZUNA_COUNTRY ?? "in,gb,us")
  .split(",")
  .map((c) => c.trim().toLowerCase())
  .filter(Boolean);

// Per-country city/region filter, e.g. "in:Kolkata,us:remote" — a country
// left out (or with nothing after the colon) searches nationwide, which is
// how "remote roles in other countries" stays broad while India narrows to
// one city. Adzuna's "where" param is a free-text location match.
const ADZUNA_LOCATIONS: Record<string, string> = Object.fromEntries(
  (process.env.ADZUNA_LOCATIONS ?? "in:Kolkata")
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [country, ...rest] = pair.split(":");
      return [country.trim().toLowerCase(), rest.join(":").trim()];
    })
    .filter(([, where]) => where)
);

async function fetchAdzunaOne(country: string, phrase: string): Promise<RawJobListing[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];

  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`);
  url.searchParams.set("app_id", appId);
  url.searchParams.set("app_key", appKey);
  url.searchParams.set("results_per_page", "50");
  url.searchParams.set("what", phrase);
  const where = ADZUNA_LOCATIONS[country];
  if (where) url.searchParams.set("where", where);
  url.searchParams.set("content-type", "application/json");

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error(`Adzuna fetch failed (${country}, "${phrase}"):`, res.status, await res.text().catch(() => ""));
    return [];
  }
  const data = await res.json();

  return (data.results ?? []).map((r: any) => ({
    sourceId: `adzuna_${country}_${r.id}`,
    source: "adzuna" as const,
    title: r.title,
    company: r.company?.display_name ?? null,
    location: r.location?.display_name ?? null,
    description: String(r.description ?? "").replace(/\s+/g, " ").trim(),
    url: r.redirect_url,
  }));
}

export async function fetchAdzunaListings(): Promise<RawJobListing[]> {
  const calls: Promise<RawJobListing[]>[] = [];
  for (const country of ADZUNA_COUNTRIES) {
    for (const phrase of SEARCH_PHRASES) {
      calls.push(fetchAdzunaOne(country, phrase));
    }
  }
  const results = (await Promise.all(calls)).flat();

  const seen = new Set<string>();
  return results.filter((r) => (seen.has(r.sourceId) ? false : (seen.add(r.sourceId), true)));
}

async function fetchJoobleOne(phrase: string): Promise<RawJobListing[]> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(`https://jooble.org/api/${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ keywords: phrase, location: process.env.JOOBLE_LOCATION ?? "" }),
  });
  if (!res.ok) {
    console.error(`Jooble fetch failed ("${phrase}"):`, res.status, await res.text().catch(() => ""));
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

export async function fetchJoobleListings(): Promise<RawJobListing[]> {
  const results = (await Promise.all(SEARCH_PHRASES.map(fetchJoobleOne))).flat();

  const seen = new Set<string>();
  return results.filter((r) => (seen.has(r.sourceId) ? false : (seen.add(r.sourceId), true)));
}

export async function fetchAllListings(): Promise<RawJobListing[]> {
  const [adzuna, jooble] = await Promise.all([fetchAdzunaListings(), fetchJoobleListings()]);
  return [...adzuna, ...jooble];
}
