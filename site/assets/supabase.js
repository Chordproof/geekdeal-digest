/* ============================================================
   GeekDeal Digest — camada de acesso ao Supabase (REST, sem SDK)
   Interface pública: window.GeekDeal
   ============================================================ */

/* >>> COLE AQUI OS VALORES DO PAINEL (Project Settings -> API) <<< */
const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";  // Cole a Project URL
const SUPABASE_ANON_KEY = "SUA-ANON-KEY";                // Cole a anon public key
/* >>> Nunca use a service_role key aqui. Ela ignora o RLS. <<< */


// Monta e executa uma chamada REST do Supabase (PostgREST).
// path: nome da tabela (ex.: "deals"); params: objeto de querystring.
async function sbFetch(path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `${SUPABASE_URL}/rest/v1/${path}${qs ? "?" + qs : ""}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json"
      }
    });

    if (!res.ok) {
      // 401/403 = RLS ou chave errada; 5xx = problema no Supabase
      console.error(`[GeekDeal] Supabase ${res.status} em ${path}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    // Falha de rede / CORS / offline: degrada graciosamente
    console.error("[GeekDeal] fetch falhou:", err);
    return null;
  }
}


// Busca ofertas com join em retailers (FK retailer_id -> retailers.id).
// Opções: { limit, offset, store, sort, market }
async function getDeals({ limit = 24, offset = 0, store = null, sort = "recent", market = null } = {}) {
  const params = {
    select: "*,retailers(name,slug)",
    limit: String(limit),
    offset: String(offset)
  };

  if (store) params["retailers.slug"] = `eq.${store}`;
  if (market) params.market = `eq.${market}`;

  if (sort === "recent")   params.order = "created_at.desc";
  if (sort === "discount") params.order = "discount_pct.desc.nullslast";
  if (sort === "price")    params.order = "offer_price.asc";
  if (sort === "score")    params.order = "score.desc.nullslast";

  const rows = await sbFetch("deals", params);
  return Array.isArray(rows) ? rows : [];
}


// Busca uma oferta individual pelo slug (página de oferta).
async function getDealBySlug(slug) {
  if (!slug) return null;

  const rows = await sbFetch("deals", {
    select: "*,retailers(name,slug,website_url)",
    slug: `eq.${slug}`,
    limit: "1"
  });

  return Array.isArray(rows) && rows.length ? rows[0] : null;
}


// Lista de lojas para montar os filtros.
async function getRetailers() {
  const rows = await sbFetch("retailers", {
    select: "id,slug,name,website_url,markets",
    order: "name.asc"
  });

  return Array.isArray(rows) ? rows : [];
}


// Contagem total de ofertas + data da última verificação.
async function getStats() {
  let total = 0;
  let lastCheck = null;

  try {
    const qs = new URLSearchParams({ select: "id" }).toString();
    const res = await fetch(`${SUPABASE_URL}/rest/v1/deals?${qs}`, {
      method: "GET",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
        Prefer: "count=exact",
        Range: "0-0"  // não baixa linhas, só o header Content-Range
      }
    });

    if (res.ok) {
      const cr = res.headers.get("content-range"); // ex.: "0-0/47"
      if (cr && cr.includes("/")) total = parseInt(cr.split("/")[1], 10) || 0;
    }
  } catch (err) {
    console.error("[GeekDeal] getStats falhou:", err);
  }

  const latest = await sbFetch("deals", {
    select: "created_at",
    order: "created_at.desc",
    limit: "1"
  });

  if (Array.isArray(latest) && latest.length) lastCheck = latest[0].created_at;

  return { total, lastCheck };
}


// Formata preço em USD ou CAD conforme a moeda da oferta.
function formatPrice(value, currency) {
  if (value === null || value === undefined || isNaN(value)) return "";

  const locale = currency === "CAD" ? "en-CA" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency === "CAD" ? "CAD" : "USD"
  }).format(value);
}


// Converte ISO em "Verified 2 hours ago" / "Verified 5 days ago".
function formatRelativeTime(isoString) {
  if (!isoString) return "";

  const then = new Date(isoString).getTime();
  if (isNaN(then)) return "";

  const mins = Math.max(0, Math.floor((Date.now() - then) / 60000));

  if (mins < 1) return "Verified just now";
  if (mins < 60) return `Verified ${mins} minute${mins === 1 ? "" : "s"} ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Verified ${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `Verified ${days} day${days === 1 ? "" : "s"} ago`;

  const months = Math.floor(days / 30);
  return `Verified ${months} month${months === 1 ? "" : "s"} ago`;
}


// Escapa HTML para prevenir XSS ao injetar títulos/lojas no DOM.
function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


// Interface pública única do módulo.
window.GeekDeal = {
  getDeals,
  getDealBySlug,
  getRetailers,
  getStats,
  formatPrice,
  formatRelativeTime,
  escapeHtml
};
