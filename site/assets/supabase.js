/* ============================================================
   GeekDeal Digest — cliente Supabase (REST)
   Interface pública: window.GeekDeal
   ============================================================ */

const SUPABASE_URL = "https://dzkbtgipmspwaglangep.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6a2J0Z2lwbXNwd2FnbGFuZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0OTE5NzUsImV4cCI6MjEwODA2Nzk3NX0.68cWjxc9tjVmeoPuZjQi75PK4hfWQrc1lX1hiyaZm8M";

const HEADERS = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": "Bearer " + SUPABASE_ANON_KEY,
  "Content-Type": "application/json"
};

async function restGet(path, params) {
  params = params || {};
  const url = new URL(SUPABASE_URL + "/rest/v1/" + path);
  Object.keys(params).forEach(function (k) {
    const v = params[k];
    if (v !== null && v !== undefined && v !== "") url.searchParams.set(k, v);
  });

  const res = await fetch(url.toString(), { headers: HEADERS });
  if (!res.ok) {
    const body = await res.text();
    throw new Error("Supabase " + res.status + ": " + body);
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

async function getDeals(opts) {
  opts = opts || {};
  const limit = opts.limit || 24;
  const offset = opts.offset || 0;
  const store = opts.store || null;
  const sort = opts.sort || "recent";
  const market = opts.market || null;

  const orderMap = {
    recent: "published_at.desc",
    score: "published_at.desc",
    discount: "published_at.desc",
    price_asc: "price.asc",
    price_desc: "price.desc"
  };

  const params = {
    select: "*",
    limit: limit,
    offset: offset,
    order: orderMap[sort] || orderMap.recent
  };

  if (store) params.retailer_slug = "eq." + store;
  if (market) params.market = "eq." + market;

  return restGet("deals_public", params);
}

async function getRetailers() {
  return restGet("retailers", {
    select: "slug,name",
    is_active: "eq.true",
    order: "name.asc"
  });
}

window.GeekDeal = {
  getDeals: getDeals,
  getRetailers: getRetailers,
  escapeHtml: escapeHtml
};
