/* ============================================================
   GeekDeal Digest — renderização das ofertas no site
   Interface pública: window.GeekDealRender
   Requer: assets/supabase.js carregado antes deste arquivo.
   ============================================================ */

const G = window.GeekDeal;


// Renderiza UM card de oferta e retorna o HTML pronto para injetar.
function renderDealCard(deal) {
  // Botão "See deal": usa affiliate_url quando existir, senão product_url.
  const hasAffiliate = Boolean(deal.affiliate_url);
  const href = hasAffiliate ? deal.affiliate_url : deal.product_url;

  const storeName = deal.retailers ? deal.retailers.name : "";
  const title = G.escapeHtml(deal.title);
  const price = G.formatPrice(deal.offer_price, deal.currency);
  const ref = G.formatPrice(deal.reference_price, deal.currency);

  // Badge de desconto
  const discount = deal.discount_pct
    ? `<span class="deal-badge">-${Math.round(deal.discount_pct)}%</span>`
    : "";

  // Score
  const score = (deal.score !== null && deal.score !== undefined)
    ? `<span class="deal-score" title="GeekDeal score">Score ${G.escapeHtml(String(deal.score))}</span>`
    : "";

  // Rótulo obrigatório da disclosure
  const linkLabel = hasAffiliate
    ? `<span class="deal-link-label">Affiliate link</span>`
    : `<span class="deal-link-label">Direct store link</span>`;

  const stamp = G.formatRelativeTime(deal.created_at);

  return `
  <article class="deal-card" data-slug="${G.escapeHtml(deal.slug)}">
    <div class="deal-card-top">
      <span class="deal-store">${G.escapeHtml(storeName)}</span>
      ${discount}
    </div>
    <h3 class="deal-title">${title}</h3>
    <div class="deal-prices">
      <span class="deal-price-now">${price}</span>
      ${ref ? `<span class="deal-price-was">${ref}</span>` : ""}
    </div>
    <div class="deal-meta">
      ${score}
      <span class="deal-verified">${stamp}</span>
    </div>
    <div class="deal-card-bottom">
      ${linkLabel}
      <a class="deal-cta" href="${G.escapeHtml(href)}" target="_blank" rel="nofollow sponsored noopener">See deal</a>
    </div>
  </article>`;
}


// Injeta os cards dentro do container indicado.
function renderDealsList(deals, containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;
  box.innerHTML = deals.map(renderDealCard).join("");
}


// Placeholders animados enquanto carrega.
function renderSkeleton(count, containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;

  const card = `
  <div class="deal-card skeleton">
    <div class="sk-line sk-w60"></div>
    <div class="sk-line sk-w90"></div>
    <div class="sk-line sk-w40"></div>
  </div>`;

  box.innerHTML = Array.from({ length: count }, () => card).join("");
}


// Mensagem quando não há ofertas.
function renderEmpty(containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;

  box.innerHTML = `
  <div class="empty-state">
    <p>No deals match your filters right now.</p>
    <p>Our pipeline refreshes every 6 hours — check back soon.</p>
  </div>`;
}


// Mensagem amigável se o Supabase falhar.
function renderError(containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;

  box.innerHTML = `
  <div class="error-state">
    <p>We couldn't load live deals.</p>
    <p>The connection to our deals database failed. Please try again in a few minutes.</p>
  </div>`;
}


// Página deals/index.html: lê query params, busca, renderiza e conecta filtros.
async function initDealsPage() {
  const CONTAINER = "deals-container";
  const params = new URLSearchParams(window.location.search);

  const state = {
    store: params.get("store") || null,
    sort: params.get("sort") || "recent",
    market: params.get("market") || null,
    page: Math.max(1, parseInt(params.get("page") || "1", 10) || 1)
  };

  const PER_PAGE = 24;

  renderSkeleton(6, CONTAINER);

  try {
    // 1) Filtros de loja
    const retailers = await G.getRetailers();
    const filterBox = document.getElementById("store-filters");

    if (filterBox && retailers.length) {
      const links = retailers.map(r => {
        const active = state.store === r.slug;
        const url = new URL(window.location.href);

        if (active) url.searchParams.delete("store");
        else url.searchParams.set("store", r.slug);

        return `<a class="store-filter${active ? " active" : ""}"
                   href="${G.escapeHtml(url.pathname + url.search)}">${G.escapeHtml(r.name)}</a>`;
      });

      filterBox.innerHTML = links.join("");
    }

    // 2) Ofertas da página corrente
    const deals = await G.getDeals({
      limit: PER_PAGE,
      offset: (state.page - 1) * PER_PAGE,
      store: state.store,
      sort: state.sort,
      market: state.market
    });

    if (!deals.length) {
      renderEmpty(CONTAINER);
      return;
    }

    renderDealsList(deals, CONTAINER);

    // 3) Ordenação
    const sortSel = document.getElementById("deal-sort");
    if (sortSel) {
      sortSel.value = state.sort;
      sortSel.addEventListener("change", () => {
        const url = new URL(window.location.href);
        url.searchParams.set("sort", sortSel.value);
        window.location.href = url.pathname + url.search;
      });
    }

  } catch (err) {
    console.error("[GeekDealRender] initDealsPage falhou:", err);
    renderError(CONTAINER);
  }
}


// Home: carrega as 3 melhores ofertas para "Deals of the Day".
async function initHomePage() {
  const CONTAINER = "home-deals";

  renderSkeleton(3, CONTAINER);

  try {
    const deals = await G.getDeals({ limit: 3, sort: "score" });

    if (!deals.length) {
      renderEmpty(CONTAINER);
      return;
    }

    renderDealsList(deals, CONTAINER);

  } catch (err) {
    console.error("[GeekDealRender] initHomePage falhou:", err);
    renderError(CONTAINER);
  }
}


// Interface pública
window.GeekDealRender = {
  renderDealCard,
  renderDealsList,
  renderSkeleton,
  renderEmpty,
  renderError,
  initDealsPage,
  initHomePage
};
