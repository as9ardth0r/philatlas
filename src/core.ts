// Logique pure (sans carte ni DOM) : recherche, liens Google Maps, agenda, GeoJSON.
import { CATEGORIES, COUNTRIES, PLACES, type Category, type Place } from './data';

export const normalize = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`-]/g, ' ').replace(/\s+/g, ' ').trim();

export type SearchResult =
  | { kind: 'place'; label: string; sub: string; place: Place }
  | { kind: 'city'; label: string; sub: string; lat: number; lng: number; count: number }
  | { kind: 'country'; label: string; sub: string; code: string; count: number };

/** Score de correspondance : 3 = commence par, 2 = un mot commence par, 1 = contient, 0 = rien. */
function score(text: string, q: string): number {
  const t = normalize(text);
  if (t.startsWith(q)) return 3;
  if (t.split(' ').some((w) => w.startsWith(q))) return 2;
  return t.includes(q) ? 1 : 0;
}

export function search(query: string, places: Place[] = PLACES, limit = 8): SearchResult[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const results: { r: SearchResult; s: number }[] = [];

  // Pays
  for (const [code, c] of Object.entries(COUNTRIES)) {
    const s = score(c.name, q);
    const count = places.filter((p) => p.country === code).length;
    if (s && count) results.push({ r: { kind: 'country', label: c.name, sub: `${count} lieu${count > 1 ? 'x' : ''}`, code, count }, s: s + 0.5 });
  }
  // Villes (regroupées)
  const cities = new Map<string, Place[]>();
  for (const p of places) cities.set(`${p.city}|${p.country}`, [...(cities.get(`${p.city}|${p.country}`) ?? []), p]);
  for (const [key, list] of cities) {
    const [city, country] = key.split('|') as [string, string];
    const s = score(city, q);
    if (!s) continue;
    const lat = list.reduce((a, p) => a + p.lat, 0) / list.length;
    const lng = list.reduce((a, p) => a + p.lng, 0) / list.length;
    results.push({ r: { kind: 'city', label: city, sub: `${COUNTRIES[country]?.name ?? country} · ${list.length} lieu${list.length > 1 ? 'x' : ''}`, lat, lng, count: list.length }, s: s + 0.4 });
  }
  // Établissements (nom, puis spécialités)
  for (const p of places) {
    const s = Math.max(score(p.name, q), ...p.specialties.map((x) => score(x, q) * 0.5));
    if (s) results.push({ r: { kind: 'place', label: p.name, sub: `${CATEGORIES[p.category].label} · ${p.city}`, place: p }, s: s + (p.premium ? 0.1 : 0) });
  }
  return results.sort((a, b) => b.s - a.s || a.r.label.localeCompare(b.r.label)).slice(0, limit).map((x) => x.r);
}

/** Liens Google Maps : par nom + ville (plus fiable qu'un point GPS approximatif). */
export function mapsLinks(p: Place) {
  const destination = encodeURIComponent([p.name, p.address ?? p.city, COUNTRIES[p.country]?.name].filter(Boolean).join(', '));
  return {
    directions: `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
    view: `https://www.google.com/maps/search/?api=1&query=${destination}`,
  };
}

export interface AgendaItem { place: Place; title: string; start: Date; end: Date }

/** Événements à venir ou en cours, du plus proche au plus lointain. */
export function agenda(now = new Date(), places: Place[] = PLACES): AgendaItem[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return places.flatMap((p) => (p.events ?? []).map((e) => ({
    place: p, title: e.title, start: new Date(`${e.start}T00:00:00`), end: new Date(`${e.end ?? e.start}T23:59:59`),
  }))).filter((e) => e.end >= today).sort((a, b) => a.start.getTime() - b.start.getTime());
}

export const formatRange = (a: AgendaItem) => {
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const s = a.start.toLocaleDateString('fr-FR', opts);
  const e = a.end.toLocaleDateString('fr-FR', { ...opts, year: 'numeric' });
  return a.start.toDateString() === new Date(a.end.getFullYear(), a.end.getMonth(), a.end.getDate()).toDateString() ? e : `${s} – ${e}`;
};

export function toGeoJSON(places: Place[], active: Set<Category>): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: places.filter((p) => active.has(p.category)).map((p) => ({
      type: 'Feature',
      id: PLACES.indexOf(p),
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { id: p.id, name: p.name, category: p.category, color: CATEGORIES[p.category].color, premium: p.premium ? 1 : 0 },
    })),
  };
}

export const countByCategory = (places: Place[] = PLACES) =>
  Object.fromEntries((Object.keys(CATEGORIES) as Category[]).map((c) => [c, places.filter((p) => p.category === c).length])) as Record<Category, number>;
