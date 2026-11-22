// Globe 3D (MapLibre, projection globe).
// Économie de données : les contours des pays (≈100 Ko) sont embarqués ; le détail des rues
// et des bâtiments (tuiles vectorielles OpenFreeMap) n'est chargé qu'à partir du zoom 4,
// donc uniquement pour la zone que l'on regarde.

import * as maplibregl from 'maplibre-gl';
import type { GeoJSONSource, Map as MLMap, StyleSpecification } from 'maplibre-gl';
// Worker MapLibre empaqueté par Vite (module ES) : indispensable pour le build de production.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
maplibregl.setWorkerUrl(workerUrl);
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import world from 'world-atlas/countries-110m.json';
import { COUNTRIES, PLACES, type Category } from './data';
import { toGeoJSON } from './core';

const OFM = 'https://tiles.openfreemap.org';
const DETAIL_ZOOM = 4;

const topo = world as unknown as Topology<{ countries: GeometryCollection<{ name: string }> }>;
export const countries = feature(topo, topo.objects.countries) as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, { name: string }>;
const interest = new Set(Object.values(COUNTRIES).map((c) => c.numeric));
// Nettoyage pour le globe : l'Antarctique (aucun lieu) et les morceaux de polygones qui
// enjambent l'antiméridien (Fidji, extrême-est de la Russie) dessinent sinon des traits parasites.
const lngSpan = (ring: GeoJSON.Position[]) => { const l = ring.map((c) => c[0]!); return Math.max(...l) - Math.min(...l); };
countries.features = countries.features.filter((f) => String(f.id) !== '010').map((f) => {
  if (f.geometry.type !== 'MultiPolygon') return f;
  return { ...f, geometry: { ...f.geometry, coordinates: f.geometry.coordinates.filter((poly) => lngSpan(poly[0]!) <= 180) } };
});
countries.features.forEach((f) => { f.properties = { ...f.properties, interest: interest.has(String(f.id)) ? 1 : 0 } as never; });

function style(): StyleSpecification {
  const detail = (layer: Record<string, unknown>) => ({ ...layer, source: 'ofm', minzoom: (layer.minzoom as number) ?? DETAIL_ZOOM });
  return {
    version: 8,
    projection: { type: 'globe' },
    glyphs: `${OFM}/fonts/{fontstack}/{range}.pbf`,
    sky: { 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0] },
    sources: {
      countries: { type: 'geojson', data: countries },
      ofm: { type: 'vector', url: `${OFM}/planet`, minzoom: DETAIL_ZOOM },
    },
    layers: [
      // Au zoom de détail, l'océan vient des tuiles (couche water) : le fond passe à la couleur des terres
      // pour éviter les trous dus aux contours simplifiés des pays.
      { id: 'ocean', type: 'background', paint: { 'background-color': ['interpolate', ['linear'], ['zoom'], DETAIL_ZOOM - 0.5, '#16324a', DETAIL_ZOOM + 0.5, '#ece2ca'] } },
      { id: 'land', type: 'fill', source: 'countries', paint: {
        // Pays où figurent des lieux légèrement plus clairs : les « zones d'intérêt »
        'fill-color': ['interpolate', ['linear'], ['zoom'], DETAIL_ZOOM - 0.5, ['case', ['==', ['get', 'interest'], 1], '#efe3c8', '#c9bea6'], DETAIL_ZOOM + 0.5, '#ece2ca'],
      } },
      // ---- détail chargé seulement au zoom (OpenFreeMap / OpenMapTiles) ----
      detail({ id: 'd-landcover', type: 'fill', 'source-layer': 'landcover', paint: { 'fill-color': '#dfe6c9', 'fill-opacity': 0.6 } }),
      detail({ id: 'd-park', type: 'fill', 'source-layer': 'park', minzoom: 9, paint: { 'fill-color': '#cfe0b4' } }),
      detail({ id: 'd-water', type: 'fill', 'source-layer': 'water', paint: { 'fill-color': '#1d4260' } }),
      detail({ id: 'd-building', type: 'fill', 'source-layer': 'building', minzoom: 14, paint: { 'fill-color': '#e2d6bd', 'fill-outline-color': '#cdbf9f' } }),
      detail({ id: 'd-roads-major', type: 'line', 'source-layer': 'transportation', minzoom: 6,
        filter: ['match', ['get', 'class'], ['motorway', 'trunk', 'primary'], true, false],
        paint: { 'line-color': '#f8f1e2', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.6, 14, 6] } }),
      detail({ id: 'd-roads-minor', type: 'line', 'source-layer': 'transportation', minzoom: 11,
        filter: ['match', ['get', 'class'], ['secondary', 'tertiary', 'minor', 'street'], true, false],
        paint: { 'line-color': '#fbf7ee', 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.5, 16, 5] } }),
      // Frontières simplifiées de loin, frontières précises des tuiles de près
      { id: 'borders', type: 'line', source: 'countries', maxzoom: DETAIL_ZOOM + 1.5, paint: {
        'line-color': '#8f7f62', 'line-width': ['interpolate', ['linear'], ['zoom'], 0, 0.4, 5, 1], 'line-opacity': ['interpolate', ['linear'], ['zoom'], DETAIL_ZOOM, 0.7, DETAIL_ZOOM + 1.5, 0] } },
      detail({ id: 'd-boundary', type: 'line', 'source-layer': 'boundary', filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
        paint: { 'line-color': '#8f7f62', 'line-width': 1.2, 'line-dasharray': [3, 2] } }),
      detail({ id: 'd-places', type: 'symbol', 'source-layer': 'place', minzoom: 5,
        filter: ['match', ['get', 'class'], ['city', 'town'], true, false],
        layout: { 'text-field': ['coalesce', ['get', 'name:fr'], ['get', 'name']], 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 5, 11, 12, 15] },
        paint: { 'text-color': '#4a3f30', 'text-halo-color': '#f7f0e0', 'text-halo-width': 1.4 } }),
    ],
  } as StyleSpecification;
}

export interface GlobeHandlers { onSelect: (id: string) => void }

export function createGlobe(container: HTMLElement, handlers: GlobeHandlers) {
  const map: MLMap = new maplibregl.Map({
    container, style: style(), center: [8, 30], zoom: 1.6, minZoom: 1, maxZoom: 17,
    attributionControl: false, renderWorldCopies: false,
  });
  map.addControl(new maplibregl.AttributionControl({
    compact: true, customAttribution: '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> · Natural Earth',
  }), 'bottom-right');
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');

  map.on('load', () => {
    map.addSource('places', {
      type: 'geojson', data: toGeoJSON(PLACES, new Set(Object.keys(PLACES.reduce((a, p) => ({ ...a, [p.category]: 1 }), {})) as Category[])),
      cluster: true, clusterRadius: 46, clusterMaxZoom: 5,
    });
    // Regroupements visibles de loin…
    map.addLayer({ id: 'clusters', type: 'circle', source: 'places', filter: ['has', 'point_count'], paint: {
      'circle-color': '#b5452f', 'circle-opacity': 0.92, 'circle-stroke-color': '#fdf6e6', 'circle-stroke-width': 2,
      'circle-radius': ['step', ['get', 'point_count'], 13, 4, 17, 8, 22] } });
    map.addLayer({ id: 'cluster-count', type: 'symbol', source: 'places', filter: ['has', 'point_count'],
      layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-allow-overlap': true },
      paint: { 'text-color': '#fff' } });
    // …et les lieux apparaissent un par un en zoomant.
    map.addLayer({ id: 'premium-halo', type: 'circle', source: 'places', filter: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'premium'], 1]],
      paint: { 'circle-radius': 15, 'circle-color': '#d9a441', 'circle-opacity': 0.28, 'circle-blur': 0.4 } });
    map.addLayer({ id: 'points', type: 'circle', source: 'places', filter: ['!', ['has', 'point_count']], paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 5, 10, 9],
      'circle-stroke-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#1b1b1b', ['==', ['get', 'premium'], 1], '#d9a441', '#fdf6e6'],
      'circle-stroke-width': ['case', ['boolean', ['feature-state', 'selected'], false], 3.5, ['==', ['get', 'premium'], 1], 3, 2] } });
    map.addLayer({ id: 'point-labels', type: 'symbol', source: 'places', filter: ['!', ['has', 'point_count']], minzoom: 7,
      layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Bold'], 'text-size': 12, 'text-offset': [0, 1.3], 'text-anchor': 'top', 'text-optional': true },
      paint: { 'text-color': '#2a2218', 'text-halo-color': '#fdf6e6', 'text-halo-width': 1.6 } });

    map.on('click', 'clusters', async (e) => {
      const f = e.features?.[0]; if (!f) return;
      const zoom = await (map.getSource('places') as GeoJSONSource).getClusterExpansionZoom(f.properties!.cluster_id as number);
      map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: zoom + 0.3, duration: 900 });
    });
    map.on('click', 'points', (e) => { const id = e.features?.[0]?.properties?.id; if (id) handlers.onSelect(String(id)); });
    for (const l of ['clusters', 'points']) {
      map.on('mouseenter', l, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', l, () => { map.getCanvas().style.cursor = ''; });
    }
  });

  // ---- Rotation automatique quand personne ne touche au globe ----
  let spinning = true, lastInteraction = 0;
  const stop = () => { spinning = false; lastInteraction = performance.now(); };
  for (const ev of ['mousedown', 'touchstart', 'wheel', 'dragstart'] as const) map.on(ev, stop);
  const spin = () => {
    if (!spinning && performance.now() - lastInteraction > 25_000 && map.getZoom() < 3 && !selectedId) spinning = true;
    if (spinning && !map.isMoving() && map.getZoom() < 3) {
      const c = map.getCenter();
      map.jumpTo({ center: [c.lng + 0.06, c.lat] });
    }
    requestAnimationFrame(spin);
  };
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) map.once('load', () => requestAnimationFrame(spin));

  let selectedId: string | null = null;
  const fid = (id: string) => PLACES.findIndex((p) => p.id === id);

  return {
    map,
    setFilter(active: Set<Category>) {
      const src = map.getSource('places') as GeoJSONSource | undefined;
      src?.setData(toGeoJSON(PLACES, active));
    },
    select(id: string | null) {
      if (selectedId !== null && fid(selectedId) >= 0) map.setFeatureState({ source: 'places', id: fid(selectedId) }, { selected: false });
      selectedId = id;
      if (id) {
        stop();
        map.setFeatureState({ source: 'places', id: fid(id) }, { selected: true });
        const p = PLACES[fid(id)]!;
        map.flyTo({ center: [p.lng, p.lat], zoom: Math.max(map.getZoom(), 12), speed: 1.4, curve: 1.5, essential: true, padding: { right: innerWidth > 760 ? 380 : 0, bottom: innerWidth > 760 ? 0 : innerHeight * 0.45 } });
      }
    },
    flyTo(lng: number, lat: number, zoom: number) { stop(); map.flyTo({ center: [lng, lat], zoom, speed: 1.3, essential: true }); },
    flyToCountry(code: string) {
      stop();
      const f = countries.features.find((x) => String(x.id) === COUNTRIES[code]?.numeric);
      const pts = PLACES.filter((p) => p.country === code);
      const coords: number[][] = f ? (f.geometry.type === 'Polygon' ? f.geometry.coordinates.flat() : f.geometry.coordinates.flat(2)) : pts.map((p) => [p.lng, p.lat]);
      // Pays sans contour à cette échelle (Monaco, Hong Kong…) : on cadre sur ses lieux
      const use = coords.length ? coords : pts.map((p) => [p.lng, p.lat]);
      const lngs = use.map((c) => c[0]!), lats = use.map((c) => c[1]!);
      if (code === 'US') { lngs.splice(0, lngs.length, -125, -66); lats.splice(0, lats.length, 24, 50); } // sans l'Alaska
      if (code === 'FR') { lngs.splice(0, lngs.length, -5, 9.6); lats.splice(0, lats.length, 41.3, 51.1); } // métropole
      // Cadrage calculé à la main : fitBounds est imprécis en projection globe.
      const [w, e] = [Math.min(...lngs), Math.max(...lngs)], [so, n] = [Math.min(...lats), Math.max(...lats)];
      const merc = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
      const W = innerWidth - 120, H = innerHeight - 220;
      const zx = Math.log2((W * 360) / (Math.max(e - w, 0.5) * 512));
      const zy = Math.log2((H * 2 * Math.PI) / (Math.max(merc(n) - merc(so), 0.01) * 512));
      map.flyTo({ center: [(w + e) / 2, (so + n) / 2], zoom: Math.min(9, Math.max(2, Math.min(zx, zy) - 0.2)), speed: 1.3, essential: true });
    },
    home() { map.flyTo({ center: [8, 30], zoom: 1.6, pitch: 0, bearing: 0, duration: 1600 }); selectedId = null; lastInteraction = 0; spinning = true; },
  };
}
