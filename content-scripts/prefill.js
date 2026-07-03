/**
 * prefill.js
 * Runs on the bazos.sk "Pridať inzerát" (add listing) page.
 * Injects a "Vyplniť z uloženého inzerátu" button that opens a small
 * on-page panel listing everything saved via capture.js. Picking one
 * fills the new-listing form fields via the DOM. Nothing is ever
 * submitted automatically — the user still has to review the form and
 * click Bazoš's own "Odoslať" button.
 *
 * ============================================================
 * SELECTORS — verified 2026-07-02 against the real form on
 * deti.bazos.sk/pridat-inzerat.php (the "Inzerát" section, i.e.
 * <form id="formpridani"> posting to insert.php). This section only
 * exists after Bazoš's one-time SMS phone verification step, so if
 * these ever stop matching, re-verify by saving the live add-listing
 * page (Ctrl+S → Webpage, HTML only) and checking the field names.
 *
 * `category` (select[name="category"]) is a SUBCATEGORY dropdown
 * whose <option value> is a numeric id specific to the top-level
 * category — the top-level category itself is chosen via subdomain
 * (see capture.js). fillCategoryField() matches by the option's
 * visible Slovak text (e.g. "Hračky") against the saved breadcrumb
 * string, best-effort.
 *
 * CAVEAT: `location` (input[name="lokalita"]) expects a PSČ/mesto
 * typed then picked from a live autocomplete dropdown
 * (naseptavacpscinsert()) — Bazoš's own JS likely needs that pick to
 * register the actual location, not just a text value. Setting
 * .value here pre-fills the text so it's visible, but double-check
 * the location before submitting.
 * ============================================================
 */
const FORM_SELECTORS = {
  title: ['input[name="nadpis"]', '#nadpis'],
  description: ['textarea[name="popis"]', '#popis'],
  price: ['input[name="cena"]', '#cena'],
  location: ['input[name="lokalita"]', '#lokalita'],
  category: ['select[name="category"]', '#category'],
  // Wraps the real "Inzerát" section (title/description/price/...).
  // Its presence is how we tell the real add-listing form apart from
  // the rubric-picker page (e.g. www.bazos.sk/pridat-inzerat.php,
  // just category tiles) and the pre-verification phone-check page —
  // neither of those have any of the fields above, and that's
  // expected, not an error.
  formContainer: ['#formpridani', 'form[name="formpridani"]'],
};

const STORAGE_KEY = 'savedListings';

function queryFirst(selectorOrList) {
  const list = Array.isArray(selectorOrList) ? selectorOrList : [selectorOrList];
  for (const sel of list) {
    const el = document.querySelector(sel);
    if (el) return el;
  }
  return null;
}

/** Sets a value on <input>/<textarea> and fires the events pages
 * typically listen for, so any live validation/char-counters on the
 * bazos.sk form pick up the change. */
function fillTextField(selectorOrList, value) {
  const el = queryFirst(selectorOrList);
  if (!el || value == null) return false;
  el.focus();
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  el.blur();
  return true;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The category <select> on rubric-specific add-listing pages (e.g.
 * pc.bazos.sk vs auto.bazos.sk each render their own #category
 * dropdown with a different <option> set) is present in the initial
 * HTML on the pages we've inspected, but we poll for it rather than
 * assume it's there immediately — some rubrics may render/replace it
 * client-side, and polling costs nothing when it's already present
 * (resolves on the first check).
 */
async function waitForCategorySelect(selectorOrList, { timeoutMs = 2000, intervalMs = 200 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let el = queryFirst(selectorOrList);
  while ((!el || el.options.length <= 1) && Date.now() < deadline) {
    await sleep(intervalMs);
    el = queryFirst(selectorOrList);
  }
  return el;
}

/** Best-effort <select> fill: matches the saved category string against
 * option value first (exact), then option text (exact, then
 * substring in both directions — case-insensitive, trimmed). Falls
 * back to doing nothing if no option matches — the user picks
 * manually. */
async function fillCategoryField(selectorOrList, categoryValue) {
  if (!categoryValue) return false;

  const el = await waitForCategorySelect(selectorOrList);
  if (!el) return false;

  if (el.tagName !== 'SELECT') {
    return fillTextField(selectorOrList, categoryValue);
  }

  const needle = categoryValue.trim().toLowerCase();
  const options = Array.from(el.options);
  const match =
    options.find((o) => o.value.trim().toLowerCase() === needle) ||
    options.find((o) => o.textContent.trim().toLowerCase() === needle) ||
    options.find((o) => o.textContent.trim() && needle.includes(o.textContent.trim().toLowerCase())) ||
    options.find((o) => o.textContent.trim() && o.textContent.trim().toLowerCase().includes(needle));

  if (!match) return false;

  el.value = match.value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

async function fillForm(listing) {
  if (!queryFirst(FORM_SELECTORS.formContainer)) {
    // Rubric-picker or pre-verification page — no fields exist here at
    // all, so there's nothing to fill and nothing to warn about.
    showImageReferencePanel(listing.imageUrls);
    return;
  }

  const results = {
    title: fillTextField(FORM_SELECTORS.title, listing.title),
    description: fillTextField(FORM_SELECTORS.description, listing.description),
    price: fillTextField(FORM_SELECTORS.price, listing.price),
    location: fillTextField(FORM_SELECTORS.location, listing.location),
    category: await fillCategoryField(FORM_SELECTORS.category, listing.category),
  };

  const filledCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  if (filledCount === 0) {
    console.warn(
      '[Bazoš Re-List Helper] Nepodarilo sa nájsť žiadne pole formulára — over FORM_SELECTORS v prefill.js ' +
        '(pozn.: pole sa objavia až po overení telefónneho čísla, pozri komentár hore v súbore).'
    );
    showToast('Formulár sa nenašiel — over FORM_SELECTORS ⚠️', true);
  } else {
    console.info(`[Bazoš Re-List Helper] Vyplnené polia: ${filledCount}/${totalCount}`, results);
    showToast(filledCount === totalCount ? 'Vyplnené ✓' : `Vyplnené čiastočne (${filledCount}/${totalCount})`);
  }

  showImageReferencePanel(listing.imageUrls);
}

function showToast(message, isError = false) {
  const existing = document.getElementById('bazos-relist-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'bazos-relist-toast';
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
  }, 2500);
}

// ------------------------------------------------------------------
// UI: trigger button + saved-listings picker panel
// ------------------------------------------------------------------

function injectPrefillButton() {
  if (document.getElementById('bazos-relist-prefill-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'bazos-relist-prefill-btn';
  btn.type = 'button';
  btn.textContent = '📋 Vyplniť z uloženého inzerátu';
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '2147483647',
    padding: '10px 16px',
    background: '#1565c0',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
    fontSize: '14px',
    fontFamily: 'Arial, sans-serif',
    cursor: 'pointer',
  });

  btn.addEventListener('click', openPickerPanel);
  document.body.appendChild(btn);
}

async function getSavedListings() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
}

async function deleteSavedListing(id) {
  const listings = await getSavedListings();
  const filtered = listings.filter((l) => l.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEY]: filtered });
}

async function openPickerPanel() {
  closePickerPanel();

  const listings = await getSavedListings();

  const overlay = document.createElement('div');
  overlay.id = 'bazos-relist-picker-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    background: 'rgba(0,0,0,0.4)',
    zIndex: '2147483646',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'Arial, sans-serif',
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePickerPanel();
  });

  const panel = document.createElement('div');
  Object.assign(panel.style, {
    background: '#fff',
    borderRadius: '10px',
    padding: '16px',
    width: 'min(520px, 90vw)',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  });

  const heading = document.createElement('h3');
  heading.textContent = 'Uložené inzeráty';
  heading.style.margin = '0 0 12px 0';
  panel.appendChild(heading);

  if (listings.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'Zatiaľ nemáš žiadne uložené inzeráty.';
    panel.appendChild(empty);
  }

  listings.forEach((listing) => {
    const item = document.createElement('div');
    Object.assign(item.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px',
      borderBottom: '1px solid #eee',
      cursor: 'pointer',
    });

    const thumb = document.createElement('img');
    thumb.src = listing.imageUrls && listing.imageUrls[0] ? listing.imageUrls[0] : '';
    Object.assign(thumb.style, {
      width: '48px',
      height: '48px',
      objectFit: 'cover',
      borderRadius: '4px',
      background: '#f0f0f0',
      flexShrink: '0',
    });

    const text = document.createElement('div');
    Object.assign(text.style, { flex: '1', minWidth: '0' });
    text.innerHTML = `<strong>${escapeHtml(listing.title || '(bez názvu)')}</strong><br><span style="color:#666;font-size:12px;">${escapeHtml(listing.price || '')}</span>`;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.textContent = '🗑️';
    deleteBtn.title = 'Zmazať uložený inzerát';
    Object.assign(deleteBtn.style, {
      flexShrink: '0',
      border: '1px solid #ccc',
      borderRadius: '4px',
      background: '#f5f5f5',
      cursor: 'pointer',
      padding: '4px 8px',
    });
    deleteBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteSavedListing(listing.id);
      item.remove();
    });

    item.appendChild(thumb);
    item.appendChild(text);
    item.appendChild(deleteBtn);
    item.addEventListener('click', async () => {
      closePickerPanel();
      await fillForm(listing);
    });

    panel.appendChild(item);
  });

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = 'Zavrieť';
  Object.assign(closeBtn.style, {
    marginTop: '12px',
    padding: '6px 12px',
  });
  closeBtn.addEventListener('click', closePickerPanel);
  panel.appendChild(closeBtn);

  overlay.appendChild(panel);
  document.body.appendChild(overlay);
}

function closePickerPanel() {
  const existing = document.getElementById('bazos-relist-picker-overlay');
  if (existing) existing.remove();
}

/** Bazoš's form requires manually attaching image files — we cannot
 * populate a <input type="file"> from a remote URL for security
 * reasons (browsers disallow scripted file input population). This
 * panel just lists the saved image URLs so the user can open/download
 * them and re-upload manually. */
function showImageReferencePanel(imageUrls) {
  const existing = document.getElementById('bazos-relist-image-panel');
  if (existing) existing.remove();

  if (!imageUrls || imageUrls.length === 0) return;

  const panel = document.createElement('div');
  panel.id = 'bazos-relist-image-panel';
  Object.assign(panel.style, {
    position: 'fixed',
    bottom: '70px',
    right: '20px',
    zIndex: '2147483646',
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '10px',
    maxWidth: '280px',
    maxHeight: '300px',
    overflowY: 'auto',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    fontFamily: 'Arial, sans-serif',
    fontSize: '12px',
  });

  const title = document.createElement('div');
  title.textContent = 'Obrázky pôvodného inzerátu (nahraj ručne):';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '6px';
  panel.appendChild(title);

  imageUrls.forEach((url) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = url;
    Object.assign(link.style, {
      display: 'block',
      wordBreak: 'break-all',
      color: '#1565c0',
      marginBottom: '4px',
    });
    panel.appendChild(link);
  });

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = 'Skryť';
  closeBtn.style.marginTop = '6px';
  closeBtn.addEventListener('click', () => panel.remove());
  panel.appendChild(closeBtn);

  document.body.appendChild(panel);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

injectPrefillButton();
