import 'maplibre-gl/dist/maplibre-gl.css';
import './styles.css';
import { CATEGORIES, COUNTRIES, PLACES, type Category, type Place } from './data';
import { agenda, countByCategory, formatRange, mapsLinks, search, type SearchResult } from './core';
import { createGlobe } from './map';

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const byId = new Map(PLACES.map((p) => [p.id, p]));

const globe = createGlobe($('#globe'), { onSelect: (id) => open(id) });
const active = new Set(Object.keys(CATEGORIES) as Category[]);

// ---------- Filtres par catégorie ----------
function renderFilters() {
  const counts = countByCategory();
  $('#filters').innerHTML = (Object.entries(CATEGORIES) as [Category, (typeof CATEGORIES)[Category]][]).map(([key, c]) => `
    <button class="chip${active.has(key) ? ' on' : ''}" data-cat="${key}" aria-pressed="${active.has(key)}" style="--c:${c.color}">
      <i>${c.icon}</i>${c.plural}<b>${counts[key]}</b>
    </button>`).join('');
}
$('#filters').addEventListener('click', (e) => {
  const key = (e.target as HTMLElement).closest<HTMLElement>('[data-cat]')?.dataset.cat as Category | undefined;
  if (!key) return;
  // Un clic isole la catégorie ; un second clic sur la seule active réaffiche tout
  if (active.size === 1 && active.has(key)) (Object.keys(CATEGORIES) as Category[]).forEach((c) => active.add(c));
  else if (active.size === Object.keys(CATEGORIES).length) { active.clear(); active.add(key); }
  else active.has(key) ? active.delete(key) : active.add(key);
  if (!active.size) (Object.keys(CATEGORIES) as Category[]).forEach((c) => active.add(c));
  renderFilters();
  globe.setFilter(active);
});

// ---------- Recherche ----------
const input = $<HTMLInputElement>('#q');
const list = $('#results');
let results: SearchResult[] = [];
let cursor = -1;
let searching = false; // vrai seulement pendant la saisie (évite le message « aucun lieu » après un choix)
const KIND_LABEL = { place: 'Lieu', city: 'Ville', country: 'Pays' } as const;

function renderResults() {
  input.setAttribute('aria-expanded', String(results.length > 0));
  list.innerHTML = results.length ? results.map((r, i) => {
    const color = r.kind === 'place' ? CATEGORIES[r.place.category].color : 'var(--ink-soft)';
    return `<li role="option" data-i="${i}" class="${i === cursor ? 'on' : ''}" aria-selected="${i === cursor}">
      <span class="dot" style="background:${color}"></span>
      <span class="r-main"><strong>${esc(r.label)}</strong><small>${esc(r.sub)}</small></span>
      <span class="r-kind">${KIND_LABEL[r.kind]}</span></li>`;
  }).join('') : (searching && input.value.trim().length >= 2 ? '<li class="empty">Aucun lieu pour l’instant. <a href="#" data-propose>Proposer un lieu ?</a></li>' : '');
}
function choose(r: SearchResult) {
  searching = false; results = []; renderResults(); input.blur();
  if (r.kind === 'place') { input.value = r.label; open(r.place.id); }
  else if (r.kind === 'city') { input.value = r.label; close(); globe.flyTo(r.lng, r.lat, r.count > 2 ? 11 : 10); }
  else { input.value = r.label; close(); globe.flyToCountry(r.code); }
}
input.addEventListener('input', () => { searching = true; results = search(input.value); cursor = results.length ? 0 : -1; renderResults(); });
input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); cursor = (cursor + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % Math.max(1, results.length); renderResults(); }
  if (e.key === 'Enter' && results[cursor]) choose(results[cursor]!);
  if (e.key === 'Escape') { searching = false; results = []; renderResults(); }
});
list.addEventListener('mousedown', (e) => {
  const li = (e.target as HTMLElement).closest<HTMLElement>('[data-i]');
  if (li) { e.preventDefault(); choose(results[Number(li.dataset.i)]!); }
  if ((e.target as HTMLElement).closest('[data-propose]')) { e.preventDefault(); propose(); }
});
input.addEventListener('blur', () => setTimeout(() => { searching = false; results = []; renderResults(); }, 120));
addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); } });

// ---------- Fiche d'un lieu ----------
const sheet = $('#sheet');
function open(id: string, { fly = true } = {}) {
  const p = byId.get(id);
  if (!p) return;
  const c = CATEGORIES[p.category];
  const links = mapsLinks(p);
  const events = agenda(new Date(), [p]);
  sheet.innerHTML = `
    <div class="stamp" style="--c:${c.color}">
      <button class="close" aria-label="Fermer la fiche">✕</button>
      <div class="stamp-head">
        <span class="cat"><i>${c.icon}</i>${c.label}</span>
        ${p.premium ? '<span class="badge gold" title="Établissement partenaire (mise en avant)">Partenaire</span>' : ''}
      </div>
      <h2>${esc(p.name)}</h2>
      <p class="where">${esc(p.city)}, ${esc(COUNTRIES[p.country]?.name ?? p.country)}</p>
      <p class="desc">${esc(p.description)}</p>
      <ul class="tags">${p.specialties.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      ${events.length ? `<div class="events"><h3>Prochaines dates</h3>${events.map((e) => `<p><b>${esc(e.title)}</b><span>${formatRange(e)}</span></p>`).join('')}<small>Dates de démonstration</small></div>` : ''}
      <dl class="facts">
        ${p.address ? `<dt>Adresse</dt><dd>${esc(p.address)}</dd>` : ''}
        ${p.website ? `<dt>Site</dt><dd><a href="${p.website}" target="_blank" rel="noopener">${esc(new URL(p.website).hostname.replace('www.', ''))}</a></dd>` : ''}
      </dl>
      <div class="actions">
        <a class="pill" href="${links.directions}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4.5 20.3l.7.7L12 18l6.8 3 .7-.7z"/></svg>Itinéraire Google Maps</a>
        <a class="pill ghost" href="${links.view}" target="_blank" rel="noopener">Voir sur Maps</a>
        <button class="pill ghost" data-share>Copier le lien</button>
      </div>
      ${p.fictional ? '<p class="fiction">Exemple fictif, créé pour la démonstration.</p>' : '<p class="fiction">Informations générales : vérifiez horaires et accès auprès de l’établissement.</p>'}
    </div>`;
  sheet.hidden = false;
  requestAnimationFrame(() => sheet.classList.add('open'));
  history.replaceState(null, '', `#lieu=${p.id}`);
  document.title = `${p.name} — Philatlas`;
  if (fly) globe.select(p.id);
}
function close() {
  sheet.classList.remove('open');
  setTimeout(() => { if (!sheet.classList.contains('open')) sheet.hidden = true; }, 250);
  globe.select(null);
  history.replaceState(null, '', location.pathname);
  document.title = 'Philatlas — l’atlas mondial de la philatélie';
}
sheet.addEventListener('click', async (e) => {
  const t = e.target as HTMLElement;
  if (t.closest('.close')) close();
  if (t.closest('[data-share]')) {
    try { await navigator.clipboard.writeText(location.href); t.textContent = 'Lien copié ✓'; } catch { t.textContent = 'Copie impossible'; }
  }
});
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !sheet.hidden && document.activeElement !== input) close(); });
$('#home').addEventListener('click', (e) => { e.preventDefault(); close(); input.value = ''; globe.home(); });

// ---------- À l'affiche : agenda des salons/ventes + partenaires ----------
function renderAgenda() {
  const items = agenda().slice(0, 4);
  $('#agenda-count').textContent = String(agenda().length);
  $('#agenda-list').innerHTML = items.map((a) => {
    const c = CATEGORIES[a.place.category];
    return `<li data-id="${a.place.id}" style="--c:${c.color}">
      <time>${a.start.toLocaleDateString('fr-FR', { day: 'numeric' })}<small>${a.start.toLocaleDateString('fr-FR', { month: 'short' })}</small></time>
      <span><strong>${esc(a.title)}</strong><small>${esc(a.place.city)} · ${c.label}${a.place.premium ? ' · <em>Partenaire</em>' : ''}</small></span></li>`;
  }).join('');
  const featured = PLACES.filter((p) => p.premium);
  $('#featured').innerHTML = `<p class="featured-title">Partenaires <span title="Emplacements mis en avant par des professionnels">Sponsorisé</span></p>` +
    featured.map((p) => `<button data-id="${p.id}" style="--c:${CATEGORIES[p.category].color}"><i>${CATEGORIES[p.category].icon}</i>${esc(p.name)}<small>${esc(p.city)}</small></button>`).join('');
}
$('#agenda').addEventListener('click', (e) => {
  const id = (e.target as HTMLElement).closest<HTMLElement>('[data-id]')?.dataset.id;
  if (id) open(id);
});
$('#agenda-toggle').addEventListener('click', () => {
  const box = $('#agenda');
  box.classList.toggle('collapsed');
  $('#agenda-toggle').setAttribute('aria-expanded', String(!box.classList.contains('collapsed')));
});
if (innerWidth < 1100) $('#agenda').classList.add('collapsed');

// ---------- Proposer un lieu (business : référencement gratuit + offre partenaire) ----------
const dialog = $<HTMLDialogElement>('#propose-dialog');
$('#propose-cat').innerHTML = Object.entries(CATEGORIES).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join('');
function propose() { dialog.showModal(); }
$('#propose').addEventListener('click', propose);
dialog.addEventListener('close', () => {
  if (dialog.returnValue !== 'send') return;
  const f = new FormData($<HTMLFormElement>('#propose-form'));
  const body = [...f.entries()].map(([k, v]) => `${k} : ${v}`).join('\n');
  location.href = `mailto:contact@philatlas.example?subject=${encodeURIComponent('Nouveau lieu : ' + f.get('name'))}&body=${encodeURIComponent(body)}`;
});

// ---------- Indice de zoom ----------
globe.map.on('zoomend', () => $('#hint').classList.toggle('gone', globe.map.getZoom() > 4));

renderFilters();
renderAgenda();
const deep = new URLSearchParams(location.hash.slice(1)).get('lieu');
if (deep && byId.has(deep)) globe.map.once('load', () => open(deep));

declare global { interface Window { philatlas: unknown } }
window.philatlas = { globe, open, places: PLACES as Place[] }; // pratique pour le débogage
