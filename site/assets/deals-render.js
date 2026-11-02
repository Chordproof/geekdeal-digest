/* ============================================================
   GeekDeal Digest - renderizacao das ofertas no site
   Interface publica: window.GeekDealRender
   ============================================================ */

// Acessa window.GeekDeal em tempo de execucao (nao no carregamento),
// para nao depender da ordem dos scripts no HTML.
function G() {
  if (!window.GeekDeal) {
    throw new Error("window.GeekDeal nao carregado - verifique assets/supabase.js");
  }
  return window.GeekDeal;
}


function renderDealCard(deal) {
  const g = G();

  const hasAffiliate = Boolean(deal.affiliate_url);
  const href = hasAffiliate ? deal.affiliate_url : deal.product_url;

  const storeName = deal.retailer_name || "";
  const title = g.escapeHtml(deal.title);
  const price = g.formatPrice(deal.price, deal.currency);

  const linkLabel = hasAffiliate
    ? '<span class="deal-link-label">Affiliate link</span>'
    : '<span class="deal-link-label">Direct store link</span>';

  const stamp = g.formatRelativeTime(deal.verified_at || deal.published_at);

  const category = deal.category
    ? '<span class="deal-badge">' + g.escapeHtml(deal.category) + '</span>'
    : "";

  return `
  <article class="deal-card" data-slug="${g.escapeHtml(deal.slug)}">
    <div class="deal-card-top">
      <span class="deal-store">${g.escapeHtml(storeName)}</span>
      ${category}
    </div>
    <h3 class="deal-title">${title}</h3>
    <div class="deal-prices">
      <span class="deal-price-now">${price}</span>
    </div>
    <div class="deal-meta">
      <span class="deal-verified">${stamp}</span>
    </div>
    <div class="deal-card-bottom">
      ${linkLabel}
      <a class="deal-cta" href="${g.escapeHtml(href)}" target="_blank" rel="nofollow sponsored noopener">See deal</a>
    </div>
  </article>`;
}


function renderDealsList(deals, containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;
  box.innerHTML = deals.map(renderDealCard).join("");
}


function renderSkeleton(count, containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;

  const card = `
  <div class="deal-card skeleton">
    <div class="sk-line sk-w60"></div>
    <div class="sk-line sk-w90"></div>
    <div class="sk-line sk-w40"></div>
  </div>`;

  box.innerHTML = Array.from({ length: count }, function () { return card; }).join("");
}


function renderEmpty(containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;

  box.innerHTML = `
  <div class="empty-state">
    <p>No deals match your filters right now.</p>
    <p>Our pipeline refreshes every 6 hours - check back soon.</p>
  </div>`;
}


function renderError(containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;

  box.innerHTML = `
  <div class="error-state">
    <p>We couldn't load live deals.</p>
    <p>The connection to our deals database failed. Please try again in a few minutes.</p>
  </div>`;
}


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
    const g = G();

    const retailers = await g.getRetailers();
    const filterBox = document.getElementById("store-filters");

    if (filterBox && retailers.length) {
      const links = retailers.map(function (r) {
        const active = state.store === r.slug;
        const url = new URL(window.location.href);

        if (active) url.searchParams.delete("store");
        else url.searchParams.set("store", r.slug);

        return '<a class="store-filter' + (active ? " active" : "") + '" href="' +
          g.escapeHtml(url.pathname + url.search) + '">' + g.escapeHtml(r.name) + '</a>';
      });

      filterBox.innerHTML = links.join("");
    }

    const deals = await g.getDeals({
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

    const sortSel = document.getElementById("deal-sort");
    if (sortSel) {
      sortSel.value = state.sort;
      sortSel.addEventListener("change", function () {
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


async function initHomePage() {
  const CONTAINER = "home-deals";

  renderSkeleton(3, CONTAINER);

  try {
    const g = G();
    const deals = await g.getDeals({ limit: 3, sort: "score" });

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


window.GeekDealRender = {
  renderDealCard: renderDealCard,
  renderDealsList: renderDealsList,
  renderSkeleton: renderSkeleton,
  renderEmpty: renderEmpty,
  renderError: renderError,
  initDealsPage: initDealsPage,
  initHomePage: initHomePage
};