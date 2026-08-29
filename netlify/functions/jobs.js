/**
 * Netlify Function: /.netlify/functions/jobs
 *
 * Server-side proxy to Loxo's Open API so the Loxo bearer token never
 * reaches the browser. Requires two Netlify environment variables
 * (Site settings -> Environment variables, NOT committed to the repo):
 *
 *   LOXO_API_KEY      - bearer token from Loxo: Settings -> API Keys
 *   LOXO_AGENCY_SLUG   - the segment of your Loxo URL after app.loxo.co/
 *                        e.g. https://app.loxo.co/forgetalent -> "forgetalent"
 *
 * NOTE: Loxo's exact JSON response shape (field names for title, location,
 * compensation, etc.) has not been verified against a live account. The
 * normalizeJob() function below covers the field names Loxo's docs and
 * public integrations commonly reference, with fallbacks, but should be
 * checked/adjusted against a real response once credentials are live
 * (this function's own error responses will surface the raw payload to
 * help with that).
 */

const CACHE_CONTROL = "public, max-age=300"; // 5 min - jobs don't need to be instant

exports.handler = async function () {
  const { LOXO_API_KEY, LOXO_AGENCY_SLUG } = process.env;

  if (!LOXO_API_KEY || !LOXO_AGENCY_SLUG) {
    return json(500, {
      error:
        "Loxo credentials are not configured. Set LOXO_API_KEY and LOXO_AGENCY_SLUG in Netlify's Environment variables and redeploy.",
    });
  }

  const base = `https://${LOXO_AGENCY_SLUG}.app.loxo.co/api/${LOXO_AGENCY_SLUG}`;
  const url = `${base}/jobs`;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${LOXO_API_KEY}`,
        Accept: "application/json",
      },
    });
  } catch (err) {
    return json(502, { error: "Could not reach Loxo API", detail: String(err) });
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return json(response.status, {
      error: "Loxo API request failed",
      status: response.status,
      detail,
    });
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    return json(502, { error: "Loxo API returned non-JSON response", detail: String(err) });
  }

  const rawJobs = Array.isArray(data) ? data : data.jobs || data.results || data.data || [];
  const jobs = rawJobs.map(normalizeJob).filter(Boolean);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": CACHE_CONTROL,
    },
    body: JSON.stringify({ jobs }),
  };
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  };
}

function normalizeJob(raw) {
  if (!raw) return null;
  return {
    id: raw.id ?? raw.job_id ?? null,
    title: raw.title ?? raw.name ?? "Untitled Role",
    location: formatLocation(raw),
    compensation: raw.salary ?? raw.compensation ?? raw.pay ?? null,
    employmentType: raw.employment_type ?? raw.job_type ?? raw.type ?? null,
    industry: raw.category ?? raw.industry ?? raw.department ?? null,
    postedAt: raw.published_at ?? raw.created_at ?? raw.posted_at ?? null,
    url: raw.public_url ?? raw.career_site_url ?? raw.url ?? null,
  };
}

function formatLocation(raw) {
  if (!raw) return null;
  if (typeof raw.location === "string") return raw.location;
  if (raw.location && typeof raw.location === "object") {
    return raw.location.name || [raw.location.city, raw.location.state].filter(Boolean).join(", ") || null;
  }
  if (raw.city || raw.state) return [raw.city, raw.state].filter(Boolean).join(", ");
  return null;
}
