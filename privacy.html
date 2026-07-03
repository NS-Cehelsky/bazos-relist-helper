/**
 * capture.js
 * Runs on live bazos.sk listing detail pages.
 * Injects a floating "Uložiť" button that scrapes the current listing
 * and stores it into chrome.storage.local -> savedListings[].
 *
 * ============================================================
 * >>> SELECTORS — verified 2026-07-02 against a real auto.bazos.sk
 * listing page, but bazos.sk has no dedicated CSS class for price or
 * location (they're plain <table> rows), so those two are read by
 * matching the row's label text (see findValueByLabel below) instead
 * of a selector. If bazos.sk changes its markup, update the entries
 * in SELECTORS (title/description/breadcrumb/images) and the label
 * strings passed to findValueByLabel() in scrapeListing().
 * Each SELECTORS entry can be a single selector string, or an array
 * of selector strings tried in order (first match wins) — handy since
 * different bazos.sk subdomains (auto.bazos.sk, reality.bazos.sk...)
 * sometimes use slightly different markup.
 * ============================================================
 */
const SELECTORS = {
  // Listing title: <h1 class="nadpisdetail">...</h1>
  title: ['h1.nadpisdetail', '.nadpis', 'h1'],

  // Full description text block: <div class="popisdetail">...</div>
  description: ['.popisdetail', '#popis', '.popis'],

  // Breadcrumb links, e.g. "Auto / Škoda" — used as a human-readable
  // subcategory hint (the subdomain is the primary category signal,
  // see extractCategory() below)
  breadcrumb: ['.drobky a', '.breadcrumb a', '#drobec a'],

  // Gallery images in the photo carousel. The full-size URL lives in
  // data-flickity-lazyload; plain `src` is only populated for the
  // first slide, so we read data-flickity-lazyload first.
  images: ['.carousel-cell-image', '.fotka img', '#fotogalery img'],
};

// ------------------------------------------------------------------

const STORAGE_KEY = 'savedListings';

function queryFirst(selectorOrList) {
  const list = Array.isArray(selectorOrList) ? selectorOrList : [selectorOrList];
  for (const sel of list) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

function queryAllFirst(selectorOrList) {
  const list = Array.isArray(selectorOrList) ? selectorOrList : [selectorOrList];
  for (const sel of list) {
    const els = document.querySelectorAll(sel);
    if (els.length) return Array.from(els);
  }
  return [];
}

function textOf(selectorOrList) {
  const el = queryFirst(selectorOrList);
  return el ? el.textContent.trim().replace(/\s+/g, ' ') : '';
}

/**
 * Bazoš renders fields like "Cena:" / "Lokalita:" as plain <table>
 * rows with no CSS class, e.g.:
 *   <tr><td>Cena:</td><td><b>12 499 €</b></td></tr>
 *   <tr><td>Lokalita:</td><td><img>...</td><td><a>979 01</a> <a>Rimavská Sobota</a></td></tr>
 * so instead of a selector we find the row whose first <td> starts
 * with the given label and read the last <td> in that row. If the
 * last cell contains links (as Lokalita does — postal code + district
 * name), the last link's text is used since that's the human-readable
 * value.
 */
function findValueByLabel(label) {
  const rows = document.querySelectorAll('table tr');
  for (const row of rows) {
    const cells = row.querySelectorAll('td');
    if (!cells.length) continue;
    const firstCellText = cells[0].textContent.trim().replace(/\s+/g, ' ');
    if (!firstCellText.startsWith(label)) continue;

    const valueCell = cells[cells.length - 1];
    const links = valueCell.querySelectorAll('a');
    if (links.length) {
      const lastLinkText = links[links.length - 1].textContent.trim();
      if (lastLinkText) return lastLinkText;
    }
    return valueCell.textContent.trim().replace(/\s+/g, ' ');
  }
  return '';
}

/**
 * Bazoš splits categories by subdomain (auto.bazos.sk, reality.bazos.sk,
 * detsky-bazar.bazos.sk, plain bazos.sk = "Všetko ostatné", ...).
 * We store the subdomain as the primary category signal since it's
 * reliable regardless of page markup changes. The breadcrumb text (if
 * found) is appended as a human-readable subcategory hint.
 */
function extractCategory() {
  const host = window.location.hostname; // e.g. "auto.bazos.sk"
  const parts = host.split('.');
  const subdomain = parts.length > 2 ? parts[0] : 'bazos'; // "auto" or generic

  const breadcrumbEls = queryAllFirst(SELECTORS.breadcrumb);
  const breadcrumbText = breadcrumbEls.map((el) => el.textContent.trim()).filter(Boolean).join(' / ');

  return breadcrumbText ? `${subdomain} (${breadcrumbText})` : subdomain;
}

function extractImageUrls() {
  const imgs = queryAllFirst(SELECTORS.images);
  const urls = imgs
    .map((img) => img.getAttribute('data-flickity-lazyload') || img.getAttribute('data-src') || img.getAttribute('src') || '')
    .filter(Boolean)
    // Resolve relative URLs against the current page
    .map((src) => new URL(src, window.location.href).href);
  // De-duplicate while preserving order
  return Array.from(new Set(urls));
}

function scrapeListing() {
  return {
    id: `listing_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    title: textOf(SELECTORS.title),
    description: textOf(SELECTORS.description),
    price: findValueByLabel('Cena'),
    category: extractCategory(),
    location: findValueByLabel('Lokalita'),
    imageUrls: extractImageUrls(),
    sourceUrl: window.location.href,
    savedAt: Date.now(),
  };
}

/**
 * Saving the same listing twice (e.g. clicking "Uložiť" again by
 * mistake) updates the existing entry instead of piling up
 * duplicates — matched by sourceUrl, since that's stable per ad.
 */
async function saveListing(listing) {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  const savedListings = Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];

  const existingIndex = savedListings.findIndex((l) => l.sourceUrl === listing.sourceUrl);
  if (existingIndex !== -1) {
    listing.id = savedListings[existingIndex].id;
    savedListings[existingIndex] = listing;
  } else {
    savedListings.unshift(listing);
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: savedListings });
}

// ------------------------------------------------------------------
// UI: floating save button + toast
// ------------------------------------------------------------------

function injectSaveButton() {
  // Avoid double-injection (e.g. if script runs more than once)
  if (document.getElementById('bazos-relist-save-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'bazos-relist-save-btn';
  btn.type = 'button';
  btn.textContent = '💾 Uložiť na neskoršie znova-vystavenie';
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '2147483647',
    padding: '10px 16px',
    background: '#2e7d32',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    fontSize: '14px',
    fontFamily: 'Arial, sans-serif',
    cursor: 'pointer',
  });

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      const listing = scrapeListing();
      await saveListing(listing);
      showToast('Uložené ✓');
    } catch (err) {
      console.error('[Bazoš Re-List Helper] Chyba pri ukladaní inzerátu:', err);
      showToast('Chyba pri ukladaní ⚠️', true);
    } finally {
      btn.disabled = false;
    }
  });

  document.body.appendChild(btn);
}

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '70px',
    right: '20px',
    zIndex: '2147483647',
    padding: '8px 14px',
    background: isError ? '#c62828' : '#333',
    color: '#fff',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'Arial, sans-serif',
    opacity: '0',
    transition: 'opacity 0.2s ease',
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

injectSaveButton();
