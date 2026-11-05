// ============================================================
// assets/supabase.js
// GeekDeal Digest — Supabase REST client (fetch nativo, sem SDK)
// ============================================================

const SUPABASE_URL = "https://dzkbtgipmspwaglangep.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6a2J0Z2lwbXNwd2FnbGFuZ2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI0OTE5NzUsImV4cCI6MjEwODA2Nzk3NX0.68cWjxc9tjVmeoPuZjQi75PK4hfWQrc1lX1hiyaZm8M";

function sbFetch(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = SUPABASE_URL + "/rest/v1/" + path + (qs ? "?" + qs : "");

  return fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + SUPABASE_ANON_KEY,
      Accept: "application/json"
    }
  })
    .then(function (res) {
      if (!res.ok) throw new Error("Supabase REST " + res.status + " em " + path);
      return res.json();
    })
    .catch(function (err) {
      console.error("GeekDeal: falha ao carregar " + path + ":", err);
      return [];
    });
}

// Lista de ofertas. sort aceita: discount_desc | price_asc | verified_desc | score
function getDeals(opts) {
  opts = opts || {};

  const params = {
    select: "*",
    limit: opts.limit || 12,
    offset: opts.offset || 0
  };

  if (opts.store) params["retailer_slug"] = "eq." + opts.store;
  if (opts.market) params.market = "eq." + opts.market;

  const sortMap = {
    discount_desc: "discount_pct.desc.nullslast",
    price_asc: "price.asc.nullslast",
    verified_desc: "verified_at.desc.nullslast",
    score: "discount_pct.desc.nullslast"
  };

  params.order = sortMap[opts.sort] || sortMap.discount_desc;

  return sbFetch("deals_public", params);
}

function getDealBySlug(slug) {
  return sbFetch("deals_public", {
    select: "*",
    slug: "eq." + slug,
    limit: 1
  }).then(function (rows) { return rows && rows[0] ? rows[0] : null; });
}

function getRetailers() {
  return sbFetch("retailers", { select: "name,slug", order: "name.asc" });
}

// Contagem exata de ofertas ativas
function getStats() {
  const url = SUPABASE_URL + "/rest/v1/deals_public?select=slug&limit=0";

  return fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: "Bearer " + SUPABASE_ANON_KEY,
      Prefer: "count=exact",
      "Content-Range": "0-0",
      Accept: "application/json"
    }
  })
    .then(function (res) {
      const range = res.headers.get("content-range");
      if (range && range.indexOf("/") !== -1) {
        return { totalDeals: parseInt(range.split("/")[1], 10) || 0 };
      }
      return { totalDeals: 0 };
    })
    .catch(function (err) {
      console.error("GeekDeal: getStats falhou:", err);
      return { totalDeals: 0 };
    });
}

function formatPrice(value, currency) {
  if (value === null || value === undefined || isNaN(value)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD"
    }).format(value);
  } catch (e) {
    return "$" + value;
  }
}

function formatRelativeTime(isoString) {
  if (!isoString) return "";
  const then = new Date(isoString).getTime();
  if (isNaN(then)) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const steps = [
    [31536000, "year"], [2592000, "month"], [604800, "week"],
    [86400, "day"], [3600, "hour"], [60, "minute"]
  ];

  for (let i = 0; i < steps.length; i++) {
    const size = steps[i][0], unit = steps[i][1];
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      return "Verified " + n + " " + unit + (n > 1 ? "s" : "") + " ago";
    }
  }
  return "Verified just now";
}

function escapeHtml(str) {
  return String(str === null || str === undefined ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

window.GeekDeal = {
  sbFetch: sbFetch,
  getDeals: getDeals,
  getDealBySlug: getDealBySlug,
  getRetailers: getRetailers,
  getStats: getStats,
  formatPrice: formatPrice,
  formatRelativeTime: formatRelativeTime,
  escapeHtml: escapeHtml
};
