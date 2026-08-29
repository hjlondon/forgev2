/* ==========================================================================
   FORGE V2 — Jobs page: fetch from the Loxo proxy (Netlify Function) and
   render job cards, with client-side filtering.

   Trade classification is a keyword heuristic over the job title, since
   Loxo's own category taxonomy hasn't been confirmed against a live
   account yet — swap classifyTrade() for a direct field mapping once
   Loxo's real category/department values are known.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", initJobsPage);

function initJobsPage() {
  const list = document.getElementById("jobs-list");
  if (!list) return; // not on the jobs page

  const statusEl = document.getElementById("jobs-status");
  const tradeSelect = document.getElementById("filter-trade");
  const locationSelect = document.getElementById("filter-location");
  const typeSelect = document.getElementById("filter-type");
  const industrySelect = document.getElementById("filter-industry");

  let allJobs = [];

  setStatus("Loading live roles...");

  fetch("/.netlify/functions/jobs")
    .then((res) => res.json().then((body) => ({ ok: res.ok, body })))
    .then(({ ok, body }) => {
      if (!ok || body.error) {
        throw new Error(body.error || "Unknown error loading jobs");
      }
      allJobs = (body.jobs || []).map((j) => ({
        ...j,
        trade: classifyTrade(j.title),
      }));

      if (!allJobs.length) {
        setStatus("No open roles are live right now — check back soon, or get in touch directly.");
        list.innerHTML = "";
        return;
      }

      setStatus("");
      populateFilterOptions(allJobs);
      render();
    })
    .catch((err) => {
      console.error("Jobs feed error:", err);
      setStatus(
        "Live roles couldn't be loaded right now. Please check back shortly, or contact us directly about current openings."
      );
      list.innerHTML = "";
    });

  [tradeSelect, locationSelect, typeSelect, industrySelect].forEach((el) => {
    if (el) el.addEventListener("change", render);
  });

  function setStatus(msg) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.display = msg ? "" : "none";
  }

  function populateFilterOptions(jobs) {
    fillSelect(locationSelect, unique(jobs.map((j) => j.location)));
    fillSelect(typeSelect, unique(jobs.map((j) => j.employmentType)));
    fillSelect(industrySelect, unique(jobs.map((j) => j.industry)));
  }

  function fillSelect(select, values) {
    if (!select) return;
    const existing = new Set(
      Array.from(select.options).map((o) => o.value || o.textContent)
    );
    values.forEach((v) => {
      if (!v || existing.has(v)) return;
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      select.appendChild(opt);
    });
  }

  function render() {
    const trade = valueOf(tradeSelect);
    const location = valueOf(locationSelect);
    const type = valueOf(typeSelect);
    const industry = valueOf(industrySelect);

    const filtered = allJobs.filter((j) => {
      if (trade && trade !== "All Trades" && j.trade !== trade) return false;
      if (location && location !== "All Locations" && j.location !== location) return false;
      if (type && type !== "All Types" && j.employmentType !== type) return false;
      if (industry && industry !== "All Industries" && j.industry !== industry) return false;
      return true;
    });

    list.innerHTML = filtered.length
      ? filtered.map(jobCardHtml).join("")
      : '<p class="section-copy">No roles match those filters right now.</p>';
  }

  function valueOf(select) {
    return select ? select.value : "";
  }
}

function jobCardHtml(job) {
  const meta = [
    job.location || "Location — TBC",
    job.compensation || "Compensation — TBC",
    job.employmentType || "Employment type — TBC",
    job.industry || "Industry — TBC",
    job.postedAt ? formatDate(job.postedAt) : "Posted — TBC",
  ];
  const href = job.url || "../contact.html";

  return `
    <div class="job-card">
      <div>
        <h3>${escapeHtml(job.title)}</h3>
        <div class="j-meta">${meta.map((m) => `<span>${escapeHtml(m)}</span>`).join("")}</div>
      </div>
      <a class="btn small ghost" href="${escapeAttr(href)}"${job.url ? ' target="_blank" rel="noopener"' : ""}>View Role</a>
    </div>`;
}

function classifyTrade(title) {
  const t = (title || "").toLowerCase();
  if (/weld/.test(t)) return "Welding";
  if (/cnc|machin|lathe|\bmill\b/.test(t)) return "CNC & Machining";
  if (/fabricat|pipefit|fitter|sheet metal/.test(t)) return "Fabrication";
  if (/maintenance|technician|supervisor|mechanic/.test(t)) return "Maintenance";
  return null;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function formatDate(value) {
  const d = new Date(value);
  return isNaN(d) ? value : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function escapeAttr(str) {
  return escapeHtml(str);
}
