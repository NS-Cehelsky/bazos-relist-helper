const STORAGE_KEY = 'savedListings';

const listEl = document.getElementById('listing-list');
const emptyStateEl = document.getElementById('empty-state');
const deleteAllBtn = document.getElementById('delete-all-btn');
const itemTemplate = document.getElementById('listing-item-template');

async function getSavedListings() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
}

async function setSavedListings(listings) {
  await chrome.storage.local.set({ [STORAGE_KEY]: listings });
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleDateString('sk-SK', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function render(listings) {
  listEl.innerHTML = '';
  emptyStateEl.hidden = listings.length !== 0;

  listings.forEach((listing) => {
    const node = itemTemplate.content.cloneNode(true);
    const li = node.querySelector('.listing-item');

    const thumb = node.querySelector('.thumb');
    thumb.src = listing.imageUrls && listing.imageUrls[0] ? listing.imageUrls[0] : '';

    node.querySelector('.title').textContent = listing.title || '(bez názvu)';
    node.querySelector('.price').textContent = listing.price || '';
    node.querySelector('.saved-at').textContent = formatDate(listing.savedAt);

    node.querySelector('.copy-btn').addEventListener('click', () => copyListing(listing));
    node.querySelector('.delete-btn').addEventListener('click', () => deleteListing(listing.id));

    li.dataset.id = listing.id;
    listEl.appendChild(node);
  });
}

async function refresh() {
  const listings = await getSavedListings();
  render(listings);
}

async function copyListing(listing) {
  const text = [
    `Názov: ${listing.title || ''}`,
    `Cena: ${listing.price || ''}`,
    `Kategória: ${listing.category || ''}`,
    `Lokalita: ${listing.location || ''}`,
    '',
    `Popis:`,
    listing.description || '',
    '',
    `Obrázky:`,
    ...(listing.imageUrls || []),
  ].join('\n');

  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('[Bazoš Re-List Helper] Kopírovanie zlyhalo:', err);
  }
}

async function deleteListing(id) {
  const listings = await getSavedListings();
  const filtered = listings.filter((l) => l.id !== id);
  await setSavedListings(filtered);
  await refresh();
}

deleteAllBtn.addEventListener('click', async () => {
  const listings = await getSavedListings();
  if (listings.length === 0) return;
  const confirmed = window.confirm('Naozaj chceš vymazať všetky uložené inzeráty?');
  if (!confirmed) return;
  await setSavedListings([]);
  await refresh();
});

refresh();
