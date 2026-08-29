# Connecting Loxo to the Jobs page

The Jobs page (`/jobs/`) fetches live roles from `/.netlify/functions/jobs`,
a serverless function that proxies Loxo's Open API. The Loxo bearer token
must never be committed to this repo or exposed in browser JS — it lives
only in Netlify's environment variables.

## 1. Get your Loxo credentials

1. Log into Loxo.
2. **Settings -> API Keys** -> generate a bearer token.
3. Note your **Agency Slug** — the part of your Loxo URL after `app.loxo.co/`
   (e.g. `https://app.loxo.co/forgetalent` -> slug is `forgetalent`).

## 2. Add them to Netlify (not this repo)

In the Netlify dashboard for this site:
**Site settings -> Environment variables -> Add a variable**

| Key | Value |
|---|---|
| `LOXO_API_KEY` | the bearer token from step 1 |
| `LOXO_AGENCY_SLUG` | your agency slug from step 1 |

Then trigger a redeploy (Netlify -> Deploys -> Trigger deploy) so the
function picks up the new variables.

## 3. Verify

Visit `https://<your-site>/.netlify/functions/jobs` directly in a browser.
You should get back JSON like:

```json
{ "jobs": [ { "id": ..., "title": "...", "location": "...", ... } ] }
```

If you instead see `{"error": "..."}`, the `detail` field in that response
usually explains what's wrong (missing/incorrect env vars, invalid token,
wrong slug, etc.).

## 4. Known gap — field mapping may need a tweak

`netlify/functions/jobs.js` maps Loxo's response fields (title, location,
compensation, employment type, industry, posted date, public URL) using
the field names commonly documented for Loxo's API, with fallbacks. This
has **not been verified against a live Loxo account** — once step 3 above
returns real data, check that the fields in the JSON line up with what's
rendered on the Jobs page. If any field comes back empty/wrong, send me
one real job's raw JSON (from that same URL) and I'll adjust the mapping
in `normalizeJob()`.

## 5. Trade classification

The "Trade" filter (Welding / CNC & Machining / Fabrication / Maintenance)
is currently guessed from keywords in the job title (see `classifyTrade()`
in `js/jobs.js`), since Loxo's own category/department taxonomy hasn't
been confirmed. If Loxo jobs come through with a clean category field that
already matches Forge's trade taxonomy, that's a better source of truth —
let me know and I'll switch to it.
