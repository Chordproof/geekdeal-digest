/* ============================================================
   GeekDeal Digest — cliente Supabase (REST)
   Interface pública: window.GeekDeal
   ============================================================ */

const SUPABASE_URL = "https://dzkbtgipmspwaglangep.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6a2J0Z2lwbXNwd2FnbGFuZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0OTE5NzUsImV4cCI6MjEwODA2Nzk3NX0.68cWjxc9tjVmeoPuZjQi75PK4hfWQrc1lX1hiyaZm8M";

const HEADERS = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

async function restGet(path, params = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== "") url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), { headers: HEADERS });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase ${res.status}: ${body}`);
  }
  return res.json();
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function getDeals({ limit = 24, offset = 0, store = null, sort = "recent", market = null } = {}) {
  const orderMap = {
    recent: "verified_at.desc",
    score: "score.desc",
    discount: "discount_pct.desc",
    price_asc: "price.asc",
    price_desc: "price.desc"
  };

  const params = {
    select: "*",
    limit,
    offset,
    order: orderMap[sort] || orderMap.recent
  };

  if (store) params.store_slug = `eq.${store}`;
  if (market) params.market = `eq.${market}`;

  return restGet("deals", params);
}

async function getRetailers() {
  return restGet("retailers", { select: "slug,name", order: "name.asc" });
}

window.GeekDeal = { getDeals, getRetailers, escapeHtml };
