/* ============================================================
   GeekDeal Digest - renderizacao das ofertas no site
   Interface publica: window.GeekDealRender
   ============================================================ */

function G() {
  if (!window.GeekDeal) {
    throw new Error("window.GeekDeal nao carregado - verifique assets/supabase.js");
  }
  return window.GeekDeal;
}


/* ---------- Card padrao ---------- */

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

  // Idade da verificacao: ambar > 24h, vermelho > 48h
  const verifiedAt = new Date(deal.verified_at || deal.published_at).getTime();
  const hoursOld = isNaN(verifiedAt) ? 0 : (Date.now() - verifiedAt) / 3600000;

  let ageClass = "deal-verified";
  if (hoursOld > 48) ageClass = "deal-verified deal-verified-stale";
  else if (hoursOld > 24) ageClass = "deal-verified deal-verified-aging";

  const category = deal.category
    ? '<span class="deal-badge">' + g.escapeHtml(deal.category) + '</span>'
    : "";

  const image = deal.image_url
    ? '<div class="deal-image"><img src="' + g.escapeHtml(deal.image_url) +
      '" alt="' + title + '" loading="lazy" width="231" height="87"></div>'
    : '<div class="deal-image deal-image-empty"></div>';

  const priceWas = (deal.price_was && Number(deal.price_was) > Number(deal.price))
    ? '<span class="deal-price-was">' + g.formatPrice(deal.price_was, deal.currency) + '</span>'
    : "";

  const discount = (deal.discount_pct && Number(deal.discount_pct) > 0)
    ? '<span class="deal-discount">-' + Math.round(deal.discount_pct) + '%</span>'
    : "";

  return `
  <article class="deal-card" data-slug="${g.escapeHtml(deal.slug)}" data-store="${g.escapeHtml(deal.retailer_slug || "")}">
    ${image}
    <div class="deal-card-top">
      <span class="deal-store">${g.escapeHtml(storeName)}</span>
      ${category}
    </div>
    <h3 class="deal-title">${title}</h3>
    <div class="deal-prices">
      <span class="deal-price-now">${price}</span>
      ${priceWas}
      ${discount}
    </div>
    <div class="deal-meta">
      <span class="${ageClass}">${stamp}</span>
    </div>
    <div class="deal-card-bottom">
      ${linkLabel}
      <a class="deal-cta" href="${g.escapeHtml(href)}" target="_blank" rel="nofollow sponsored noopener">See deal</a>
    </div>
  </article>`;
}


/* ---------- Card destaque (hero do deal) ---------- */

function renderFeaturedCard(deal) {
  const g = G();

  const hasAffiliate = Boolean(deal.affiliate_url);
  const href = hasAffiliate ? deal.affiliate_url : deal.product_url;

  const title = g.escapeHtml(deal.title);
  const price = g.formatPrice(deal.price, deal.currency);
  const stamp = g.formatRelativeTime(deal.verified_at || deal.published_at);

  const image = deal.image_url
    ? '<div class="featured-image"><img src="' + g.escapeHtml(deal.image_url) +
      '" alt="' + title + '" width="231" height="87"></div>'
    : '<div class="featured-image featured-image-empty"></div>';

  const priceWas = (deal.price_was && Number(deal.price_was) > Number(deal.price))
    ? '<span class="featured-price-was">' + g.formatPrice(deal.price_was, deal.currency) + '</span>'
    : "";

  const discount = (deal.discount_pct && Number(deal.discount_pct) > 0)
    ? '<span class="featured-discount">-' + Math.round(deal.discount_pct) + '%</span>'
    : "";

  return `
  <article class="featured-card">
    <div class="featured-label">Deal of the Day</div>
    <div class="featured-body">
      ${image}
      <div class="featured-content">
        <span class="featured-store">${g.escapeHtml(deal.retailer_name || "")}</span>
        <h2 class="featured-title">${title}</h2>
        <div class="featured-prices">
          <span class="featured-price-now">${price}</span>
          ${priceWas}
          ${discount}
        </div>
        <div class="featured-meta">${stamp}</div>
        <a class="featured-cta" href="${g.escapeHtml(href)}" target="_blank" rel="nofollow sponsored noopener">See this deal →</a>
      </div>
    </div>
  </article>`;
}


/* ---------- Listas e estados ---------- */

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


/* ---------- Selecao do destaque ---------- */

// Escolhe o deal de destaque por relevancia comercial.
// Combina desconto, preco final e notoriedade do titulo.
function pickFeatured(deals) {
  const MIN_PRICE = 4;

  // Titulos AAA / alta notoriedade recebem bonus
  const AAA = [
    "hogwarts legacy", "borderlands 3", "mortal kombat", "monster hunter",
    "dragon ball", "robocop", "steelrising", "back 4 blood", "tomb raider",
    "plague tale", "batman", "middle-earth", "lego", "dishonored",
    "frostpunk", "this war of mine", "warhammer", "divinity", "disco elysium",
    "talos principle", "children of morta", "rise of the tomb raider"
  ];

  function score(d) {
    const price = Number(d.price) || 0;
    const pct = Number(d.discount_pct) || 0;
    const title = String(d.title || "").toLowerCase();

    // Desconto pesa 1x, preco final pesa 2x (evita lixo de $0.42)
    let s = pct + price * 2;

    // Bonus de notoriedade
    if (AAA.some(function (k) { return title.indexOf(k) !== -1; })) {
      s += 25;
    }

    return s;
  }

  const eligible = deals.filter(function (d) {
    return Number(d.price) >= MIN_PRICE && Number(d.discount_pct) > 0;
  });

  const pool = eligible.length ? eligible : deals;

  return pool.slice().sort(function (a, b) {
    return score(b) - score(a);
  })[0] || null;
}


/* ---------- Chips de loja ---------- */

function renderStoreChips(deals, containerId, onSelect) {
  const box = document.getElementById(containerId);
  if (!box) return;

  const g = G();
  const map = {};

  deals.forEach(function (d) {
    if (!d.retailer_slug) return;
    if (!map[d.retailer_slug]) {
      map[d.retailer_slug] = { slug: d.retailer_slug, name: d.retailer_name || d.retailer_slug, count: 0 };
    }
    map[d.retailer_slug].count++;
  });

  const stores = Object.keys(map).map(function (k) { return map[k]; });
  stores.sort(function (a, b) { return b.count - a.count; });

  const chips = ['<button type="button" class="store-filter active" data-store="">All stores</button>'];

  stores.forEach(function (s) {
    chips.push(
      '<button type="button" class="store-filter" data-store="' + g.escapeHtml(s.slug) + '">' +
      g.escapeHtml(s.name) + ' <span class="chip-count">' + s.count + '</span></button>'
    );
  });

  box.innerHTML = chips.join("");

  box.querySelectorAll(".store-filter").forEach(function (btn) {
    btn.addEventListener("click", function () {
      box.querySelectorAll(".store-filter").forEach(function (b) {
        b.classList.remove("active");
      });
      btn.classList.add("active");
      onSelect(btn.getAttribute("data-store") || null);
    });
  });
}


/* ---------- Pagina de deals ---------- */

async function initDealsPage() {
  const CONTAINER = "deals-container";
  const params = new URLSearchParams(window.location.search);

  const state = {
    store: params.get("store") || null,
    sort: params.get("sort") || "discount_desc",
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


/* ---------- Home ---------- */

async function initHomePage() {
  const CONTAINER = "home-deals";
  const FEATURED = "home-featured";
  const CHIPS = "home-filters";

  renderSkeleton(9, CONTAINER);

  try {
    const g = G();

    // Uma unica chamada: 30 deals ordenados por desconto
    const deals = await g.getDeals({ limit: 30, sort: "discount_desc" });

    if (!deals.length) {
      renderEmpty(CONTAINER);
      const featBox = document.getElementById(FEATURED);
      if (featBox) featBox.innerHTML = "";
      return;
    }

    // Destaque
    const featured = pickFeatured(deals);
    const featBox = document.getElementById(FEATURED);
    if (featBox && featured) {
      featBox.innerHTML = renderFeaturedCard(featured);
    }

    // Stats
    renderStats(deals);

    // Grid inicial: 9 primeiros
    let currentStore = null;

    function paint() {
      const filtered = currentStore
        ? deals.filter(function (d) { return d.retailer_slug === currentStore; })
        : deals;

      if (!filtered.length) {
        renderEmpty(CONTAINER);
        return;
      }

      renderDealsList(filtered.slice(0, 9), CONTAINER);
    }

    paint();

    // Chips
    renderStoreChips(deals, CHIPS, function (store) {
      currentStore = store;
      paint();
    });

  } catch (err) {
    console.error("[GeekDealRender] initHomePage falhou:", err);
    renderError(CONTAINER);
  }
}


window.GeekDealRender = {
  renderDealCard: renderDealCard,
  renderFeaturedCard: renderFeaturedCard,
  renderDealsList: renderDealsList,
  renderSkeleton: renderSkeleton,
  renderEmpty: renderEmpty,
  renderError: renderError,
  renderStats: renderStats,
  renderStoreChips: renderStoreChips,
  pickFeatured: pickFeatured,
  initDealsPage: initDealsPage,
  initHomePage: initHomePage
};
