// Jeu de données de démonstration.
// - Institutions réelles (musées, maisons de vente, salons, imprimeurs) : informations générales uniquement,
//   sans horaires ni téléphone. Coordonnées approximatives : l'itinéraire passe par une recherche Google Maps
//   sur le nom et la ville, plus fiable qu'un point GPS.
// - Établissements marqués `fictional` : exemples inventés pour illustrer les catégories et l'offre premium.
// - Toutes les dates d'événements sont des dates de démonstration.

export type Category = 'boutique' | 'vente' | 'musee' | 'expert' | 'salon' | 'atelier';

export interface PlaceEvent { title: string; start: string; end?: string }
export interface Place {
  id: string;
  name: string;
  category: Category;
  city: string;
  country: string; // code ISO alpha-2
  lat: number;
  lng: number;
  description: string;
  specialties: string[];
  address?: string;
  website?: string;
  fictional?: boolean;
  premium?: boolean;
  events?: PlaceEvent[];
}

export const CATEGORIES: Record<Category, { label: string; plural: string; color: string; icon: string }> = {
  boutique: { label: 'Boutique', plural: 'Boutiques', color: '#2f7d6d', icon: '◆' },
  vente:    { label: 'Maison de vente', plural: 'Maisons de vente', color: '#b5452f', icon: '⚖' },
  musee:    { label: 'Musée', plural: 'Musées', color: '#3f5fa8', icon: '▲' },
  expert:   { label: 'Expert', plural: 'Experts', color: '#7a4fa0', icon: '◉' },
  salon:    { label: 'Salon', plural: 'Salons', color: '#c78a1e', icon: '★' },
  atelier:  { label: 'Atelier & impression', plural: 'Ateliers & impression', color: '#5b6b73', icon: '✚' },
};

/** Pays présents : nom français et identifiant numérique ISO 3166 (pour retrouver le contour). */
export const COUNTRIES: Record<string, { name: string; numeric: string }> = {
  FR: { name: 'France', numeric: '250' },
  GB: { name: 'Royaume-Uni', numeric: '826' },
  DE: { name: 'Allemagne', numeric: '276' },
  CH: { name: 'Suisse', numeric: '756' },
  MC: { name: 'Monaco', numeric: '492' },
  BE: { name: 'Belgique', numeric: '056' },
  NL: { name: 'Pays-Bas', numeric: '528' },
  ES: { name: 'Espagne', numeric: '724' },
  PT: { name: 'Portugal', numeric: '620' },
  IT: { name: 'Italie', numeric: '380' },
  SE: { name: 'Suède', numeric: '752' },
  US: { name: 'États-Unis', numeric: '840' },
  CA: { name: 'Canada', numeric: '124' },
  JP: { name: 'Japon', numeric: '392' },
  HK: { name: 'Hong Kong', numeric: '344' },
  AU: { name: 'Australie', numeric: '036' },
  BR: { name: 'Brésil', numeric: '076' },
  MA: { name: 'Maroc', numeric: '504' },
};

export const PLACES: Place[] = [
  // ---------- Musées ----------
  { id: 'musee-poste-paris', name: 'Musée de La Poste', category: 'musee', city: 'Paris', country: 'FR', lat: 48.8425, lng: 2.3196,
    address: '34 boulevard de Vaugirard, 75015 Paris', website: 'https://www.museedelaposte.fr',
    description: 'Le musée national consacré à l’histoire de la poste et du timbre en France, de la poste aux chevaux aux timbres contemporains.',
    specialties: ['Histoire postale', 'Collections nationales', 'Expositions temporaires'] },
  { id: 'npm-washington', name: 'Smithsonian National Postal Museum', category: 'musee', city: 'Washington', country: 'US', lat: 38.8981, lng: -77.0083,
    website: 'https://postalmuseum.si.edu',
    description: 'Le musée postal de la Smithsonian Institution, voisin de la gare Union Station, abrite l’une des plus grandes collections philatéliques au monde.',
    specialties: ['Philatélie américaine', 'Raretés', 'Galerie William H. Gross'] },
  { id: 'postal-museum-london', name: 'The Postal Museum', category: 'musee', city: 'Londres', country: 'GB', lat: 51.5246, lng: -0.1137,
    website: 'https://www.postalmuseum.org',
    description: 'Le musée de la poste britannique, avec la galerie du Penny Black et le petit train souterrain Mail Rail.',
    specialties: ['Penny Black', 'Royal Mail', 'Mail Rail'] },
  { id: 'mfk-berlin', name: 'Museum für Kommunikation Berlin', category: 'musee', city: 'Berlin', country: 'DE', lat: 52.5107, lng: 13.3878,
    description: 'Musée de la communication installé dans l’ancien musée postal impérial, avec une chambre forte de raretés philatéliques.',
    specialties: ['Raretés', 'Histoire des communications'] },
  { id: 'mfk-bern', name: 'Musée de la communication', category: 'musee', city: 'Berne', country: 'CH', lat: 46.9419, lng: 7.4498,
    description: 'Le musée suisse de la communication, dont la collection philatélique couvre la Suisse et le monde.',
    specialties: ['Philatélie suisse', 'Collection mondiale'] },
  { id: 'mtm-monaco', name: 'Musée des Timbres et des Monnaies', category: 'musee', city: 'Monaco', country: 'MC', lat: 43.7307, lng: 7.4166,
    description: 'Timbres, maquettes et monnaies de la Principauté, dans le quartier de Fontvieille.',
    specialties: ['Monaco', 'Maquettes originales', 'Numismatique'] },
  { id: 'postmuseum-stockholm', name: 'Postmuseum', category: 'musee', city: 'Stockholm', country: 'SE', lat: 59.3236, lng: 18.0688,
    description: 'Le musée de la poste suédoise, au cœur de la vieille ville de Gamla stan.',
    specialties: ['Philatélie suédoise', 'Histoire postale nordique'] },
  { id: 'postal-museum-japan', name: 'Postal Museum Japan', category: 'musee', city: 'Tokyo', country: 'JP', lat: 35.7101, lng: 139.8107,
    description: 'Musée postal japonais, au pied de la tour Tokyo Skytree, réputé pour sa très vaste collection de timbres du monde entier.',
    specialties: ['Philatélie japonaise', 'Timbres du monde'] },
  { id: 'museo-postal-madrid', name: 'Museo Postal y Telegráfico', category: 'musee', city: 'Las Rozas de Madrid', country: 'ES', lat: 40.4929, lng: -3.8737,
    description: 'Le musée espagnol de la poste et du télégraphe, en périphérie de Madrid.',
    specialties: ['Philatélie espagnole', 'Télégraphie'] },
  { id: 'fpc-lisboa', name: 'Musée des Communications', category: 'musee', city: 'Lisbonne', country: 'PT', lat: 38.7066, lng: -9.1569,
    description: 'Le musée de la Fondation portugaise des communications, près des quais du Tage.',
    specialties: ['Philatélie portugaise', 'Histoire postale'] },

  // ---------- Maisons de vente ----------
  { id: 'feldman', name: 'David Feldman', category: 'vente', city: 'Genève', country: 'CH', lat: 46.1700, lng: 6.1230,
    description: 'Maison de ventes aux enchères genevoise de renommée internationale, spécialisée en philatélie de prestige.',
    specialties: ['Raretés mondiales', 'Ventes de prestige'] },
  { id: 'spink', name: 'Spink', category: 'vente', city: 'Londres', country: 'GB', lat: 51.5197, lng: -0.1216,
    description: 'Maison londonienne historique de ventes aux enchères de timbres, monnaies et objets de collection.',
    specialties: ['Grande-Bretagne', 'Commonwealth', 'Numismatique'] },
  { id: 'corinphila', name: 'Corinphila', category: 'vente', city: 'Zurich', country: 'CH', lat: 47.3627, lng: 8.5298,
    description: 'Maison de ventes zurichoise, référence pour la philatélie suisse et les grandes collections européennes.',
    specialties: ['Suisse', 'Europe classique'] },
  { id: 'koehler', name: 'Heinrich Köhler', category: 'vente', city: 'Wiesbaden', country: 'DE', lat: 50.0826, lng: 8.2400,
    description: 'L’une des plus anciennes maisons de ventes philatéliques d’Allemagne.',
    specialties: ['Allemagne', 'États allemands'] },
  { id: 'gaertner', name: 'Christoph Gärtner', category: 'vente', city: 'Bietigheim-Bissingen', country: 'DE', lat: 48.9667, lng: 9.1333,
    description: 'Maison de ventes allemande organisant plusieurs grandes ventes philatéliques et numismatiques par an.',
    specialties: ['Monde entier', 'Lots et collections'] },
  { id: 'siegel', name: 'Robert A. Siegel Auction Galleries', category: 'vente', city: 'New York', country: 'US', lat: 40.7536, lng: -73.9832,
    description: 'Maison new-yorkaise spécialisée dans les timbres des États-Unis et les grandes ventes de raretés.',
    specialties: ['États-Unis', 'Raretés'] },
  { id: 'interasia', name: 'Interasia Auctions', category: 'vente', city: 'Hong Kong', country: 'HK', lat: 22.2810, lng: 114.1580,
    description: 'Maison de ventes de Hong Kong dédiée à la philatélie de Chine et d’Asie.',
    specialties: ['Chine', 'Asie', 'Hong Kong'] },
  { id: 'roumet', name: 'Roumet', category: 'vente', city: 'Paris', country: 'FR', lat: 48.8730, lng: 2.3420,
    description: 'Maison parisienne de ventes sur offres en philatélie et histoire postale, près de Drouot.',
    specialties: ['France', 'Histoire postale', 'Ventes sur offres'] },

  // ---------- Salons ----------
  { id: 'stampex', name: 'Stampex International', category: 'salon', city: 'Londres', country: 'GB', lat: 51.5363, lng: -0.1059,
    description: 'Le grand salon philatélique britannique, organisé deux fois par an à Londres.',
    specialties: ['Négociants', 'Expositions', 'Conférences'],
    events: [{ title: 'Stampex printemps', start: '2027-02-17', end: '2027-02-20' }, { title: 'Stampex automne', start: '2027-09-29', end: '2027-10-02' }] },
  { id: 'paris-philex', name: 'Paris-Philex', category: 'salon', city: 'Paris', country: 'FR', lat: 48.8862, lng: 2.2845,
    description: 'Salon philatélique parisien réunissant négociants, La Poste et les associations.',
    specialties: ['Nouveautés', 'Premiers jours', 'Négociants'],
    events: [{ title: 'Paris-Philex 2027', start: '2027-06-10', end: '2027-06-13' }] },
  { id: 'monacophil', name: 'Monacophil', category: 'salon', city: 'Monaco', country: 'MC', lat: 43.7350, lng: 7.4219,
    description: 'Exposition philatélique internationale de prestige, organisée en Principauté.',
    specialties: ['Raretés', 'Collections de prestige'],
    events: [{ title: 'Monacophil', start: '2027-11-25', end: '2027-11-27' }] },
  { id: 'essen', name: 'Internationale Briefmarken-Messe', category: 'salon', city: 'Essen', country: 'DE', lat: 51.4303, lng: 6.9967,
    description: 'Grand salon allemand du timbre, au parc des expositions d’Essen.',
    specialties: ['Négociants', 'Postes européennes'],
    events: [{ title: 'Briefmarken-Messe Essen', start: '2027-05-06', end: '2027-05-08' }] },
  { id: 'sindelfingen', name: 'Internationale Briefmarken-Börse', category: 'salon', city: 'Sindelfingen', country: 'DE', lat: 48.7090, lng: 9.0030,
    description: 'Bourse aux timbres internationale, rendez-vous d’automne des collectionneurs du sud de l’Allemagne.',
    specialties: ['Bourse', 'Négociants'],
    events: [{ title: 'Bourse de Sindelfingen', start: '2027-10-21', end: '2027-10-23' }] },

  // ---------- Boutiques ----------
  { id: 'stanley-gibbons', name: 'Stanley Gibbons', category: 'boutique', city: 'Londres', country: 'GB', lat: 51.5104, lng: -0.1220,
    description: 'Négociant historique et éditeur des célèbres catalogues de cotation, avec sa boutique sur le Strand.',
    specialties: ['Catalogues', 'Grande-Bretagne', 'Accessoires'] },
  { id: 'carre-marigny', name: 'Marché aux timbres du Carré Marigny', category: 'boutique', city: 'Paris', country: 'FR', lat: 48.8694, lng: 2.3150,
    description: 'Le marché en plein air des collectionneurs de timbres et de cartes, à deux pas des Champs-Élysées.',
    specialties: ['Marché', 'Échanges', 'Cartes postales'] },
  { id: 'opale-philatelie', name: 'Opale Philatélie', category: 'boutique', city: 'Boulogne-sur-Mer', country: 'FR', lat: 50.7264, lng: 1.6147, fictional: true, premium: true,
    description: 'Boutique de quartier : France, colonies, thématiques marine et phares. Estimation gratuite de collections le samedi.',
    specialties: ['France', 'Thématique marine', 'Estimation gratuite'],
    events: [{ title: 'Journée estimation gratuite', start: '2027-01-16' }] },
  { id: 'comptoir-lyon', name: 'Le Comptoir du Timbre', category: 'boutique', city: 'Lyon', country: 'FR', lat: 45.7640, lng: 4.8357, fictional: true,
    description: 'Timbres de France et d’Europe, fournitures, albums et classeurs.', specialties: ['France', 'Fournitures'] },
  { id: 'bruxelles-philately', name: 'Galerie du Timbre', category: 'boutique', city: 'Bruxelles', country: 'BE', lat: 50.8467, lng: 4.3525, fictional: true,
    description: 'Belgique, Congo belge et marcophilie, dans le centre historique.', specialties: ['Belgique', 'Congo belge'] },
  { id: 'montreal-timbres', name: 'Philatélie Mont-Royal', category: 'boutique', city: 'Montréal', country: 'CA', lat: 45.5240, lng: -73.5810, fictional: true,
    description: 'Timbres du Canada et de France, achat de collections.', specialties: ['Canada', 'Achat de collections'] },
  { id: 'sydney-stamps', name: 'Harbour Stamps', category: 'boutique', city: 'Sydney', country: 'AU', lat: -33.8688, lng: 151.2093, fictional: true,
    description: 'Australie, Pacifique et nouveautés du Commonwealth.', specialties: ['Australie', 'Pacifique'] },
  { id: 'rio-selos', name: 'Casa dos Selos', category: 'boutique', city: 'Rio de Janeiro', country: 'BR', lat: -22.9068, lng: -43.1729, fictional: true,
    description: 'Brésil classique, « Olho de Boi » et histoire postale sud-américaine.', specialties: ['Brésil', 'Amérique du Sud'] },
  { id: 'casa-timbres', name: 'Philatélie de l’Atlas', category: 'boutique', city: 'Casablanca', country: 'MA', lat: 33.5731, lng: -7.5898, fictional: true,
    description: 'Maroc, poste chérifienne et bureaux étrangers.', specialties: ['Maroc', 'Bureaux étrangers'] },

  // ---------- Experts ----------
  { id: 'expert-paris', name: 'Cabinet Valmont Expertise', category: 'expert', city: 'Paris', country: 'FR', lat: 48.8566, lng: 2.3522, fictional: true, premium: true,
    description: 'Expertise et certificats pour la France classique et les colonies. Inventaires de successions.',
    specialties: ['Certificats', 'France classique', 'Successions'] },
  { id: 'expert-geneve', name: 'Atelier d’expertise Lémanique', category: 'expert', city: 'Genève', country: 'CH', lat: 46.2044, lng: 6.1432, fictional: true,
    description: 'Expertise de la Suisse et du Liechtenstein, examen aux ultraviolets et infrarouges.', specialties: ['Suisse', 'Analyse UV/IR'] },
  { id: 'expert-roma', name: 'Studio Peritale Aurelio', category: 'expert', city: 'Rome', country: 'IT', lat: 41.9028, lng: 12.4964, fictional: true,
    description: 'Anciens États italiens et Vatican : expertise et certificats photographiques.', specialties: ['États italiens', 'Vatican'] },
  { id: 'expert-ny', name: 'Hudson Philatelic Opinions', category: 'expert', city: 'New York', country: 'US', lat: 40.7128, lng: -74.0060, fictional: true,
    description: 'Certificats d’authenticité pour les timbres des États-Unis et de la zone Caraïbes.', specialties: ['États-Unis', 'Caraïbes'] },

  // ---------- Ateliers & impression ----------
  { id: 'phil-poste', name: 'Imprimerie des timbres-poste de Boulazac', category: 'atelier', city: 'Boulazac', country: 'FR', lat: 45.1800, lng: 0.7600,
    description: 'Le site où sont imprimés les timbres-poste français, près de Périgueux.', specialties: ['Impression', 'Taille-douce', 'Héliogravure'] },
  { id: 'cartor', name: 'Cartor Security Printing', category: 'atelier', city: 'La Loupe', country: 'FR', lat: 48.4733, lng: 1.0150,
    description: 'Imprimeur de sécurité réalisant des timbres pour de nombreuses administrations postales.', specialties: ['Impression', 'Offset', 'Sécurité'] },
  { id: 'enschede', name: 'Joh. Enschedé', category: 'atelier', city: 'Haarlem', country: 'NL', lat: 52.3874, lng: 4.6462,
    description: 'Imprimeur néerlandais historique de timbres et de billets de banque.', specialties: ['Impression', 'Histoire de l’imprimerie'] },
  { id: 'atelier-restauration-lille', name: 'Atelier Papier & Gomme', category: 'atelier', city: 'Lille', country: 'FR', lat: 50.6292, lng: 3.0573, fictional: true, premium: true,
    description: 'Restauration de lettres anciennes, nettoyage et mise sous pochette de conservation. Restaurations toujours signalées.',
    specialties: ['Restauration', 'Conservation', 'Lettres anciennes'] },
  { id: 'atelier-bordeaux', name: 'Atelier de la Gironde', category: 'atelier', city: 'Bordeaux', country: 'FR', lat: 44.8378, lng: -0.5792, fictional: true,
    description: 'Conservation préventive : albums neutres, pochettes sans acide, conseils de stockage.', specialties: ['Conservation', 'Fournitures d’archive'] },
  { id: 'atelier-tokyo', name: 'Kitte Restoration Studio', category: 'atelier', city: 'Tokyo', country: 'JP', lat: 35.6762, lng: 139.6503, fictional: true,
    description: 'Restauration de papiers anciens et d’entiers postaux japonais.', specialties: ['Restauration', 'Japon'] },
];
