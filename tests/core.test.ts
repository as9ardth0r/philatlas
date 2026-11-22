import { describe, it, expect } from 'vitest';
import { search, normalize, mapsLinks, agenda, toGeoJSON, countByCategory } from '../src/core';
import { PLACES, CATEGORIES, COUNTRIES, type Category } from '../src/data';

describe('données', () => {
  it('ont des identifiants uniques, des coordonnées valides et des pays connus', () => {
    expect(new Set(PLACES.map((p) => p.id)).size).toBe(PLACES.length);
    for (const p of PLACES) {
      expect(Math.abs(p.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(p.lng)).toBeLessThanOrEqual(180);
      expect(COUNTRIES[p.country], p.id).toBeDefined();
      expect(CATEGORIES[p.category]).toBeDefined();
    }
  });
  it('couvrent les six catégories', () => {
    expect(Object.values(countByCategory()).every((n) => n > 0)).toBe(true);
  });
  it('ne mettent en avant (premium) que des exemples fictifs', () => {
    expect(PLACES.filter((p) => p.premium).every((p) => p.fictional)).toBe(true);
  });
});

describe('recherche', () => {
  it('ignore accents et majuscules', () => {
    expect(normalize('Genève')).toBe(normalize('geneve'));
    expect(search('geneve')[0]).toMatchObject({ kind: 'city', label: 'Genève' });
  });
  it('trouve un pays par son nom français', () => {
    expect(search('allem')[0]).toMatchObject({ kind: 'country', code: 'DE' });
  });
  it('trouve un établissement par son nom ou une spécialité', () => {
    expect(search('spink').some((r) => r.kind === 'place' && r.place.id === 'spink')).toBe(true);
    expect(search('penny').some((r) => r.kind === 'place' && r.place.id === 'postal-museum-london')).toBe(true);
  });
  it('regroupe une ville avec plusieurs lieux', () => {
    const london = search('londres').find((r) => r.kind === 'city');
    expect(london && london.kind === 'city' && london.count).toBeGreaterThanOrEqual(4);
  });
  it('ne répond pas sous deux caractères', () => {
    expect(search('p')).toEqual([]);
  });
});

describe('liens Google Maps', () => {
  it('construit un itinéraire encodé vers le nom et la ville', () => {
    const p = PLACES.find((x) => x.id === 'musee-poste-paris')!;
    const { directions, view } = mapsLinks(p);
    expect(directions).toMatch(/^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=/);
    expect(decodeURIComponent(directions)).toContain('Musée de La Poste, 34 boulevard de Vaugirard');
    expect(view).toContain('maps/search/?api=1&query=');
  });
});

describe('agenda', () => {
  it('trie les événements à venir et écarte ceux qui sont passés', () => {
    const items = agenda(new Date('2027-06-12'));
    expect(items[0]!.title).toBe('Paris-Philex 2027'); // en cours le 12 juin
    expect(items.every((e) => e.end >= new Date('2027-06-12'))).toBe(true);
    expect(items.map((e) => e.start.getTime())).toEqual([...items.map((e) => e.start.getTime())].sort((a, b) => a - b));
  });
});

describe('GeoJSON', () => {
  it('filtre par catégorie active', () => {
    const fc = toGeoJSON(PLACES, new Set<Category>(['musee']));
    expect(fc.features.length).toBe(countByCategory().musee);
    expect(fc.features.every((f) => f.properties!.category === 'musee')).toBe(true);
  });
});
