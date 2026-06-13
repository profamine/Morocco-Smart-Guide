export interface Monument {
  id: string | number; // String for Firebase IDs, number for legacy
  nom?: string;
  ville?: string;
  region?: string;
  latitude: number;
  longitude: number;
  categorie?: string;
  description: string;
  histoire?: string;
  horaires?: string;
  tarif?: string;
  accessibilite?: string;
  dureeVisite?: string;
  images?: string[];
  audioGuide?: string;
  noteMoyenne?: number;
  
  // Legacy fields to maintain compatibility until full migration
  name?: string;
  city?: string;
  category?: string;
  history?: string;
  image?: string;
}

export type AlertRadius = 100 | 200 | 300 | 500 | 1000 | 2000;

export interface UserLocation {
  latitude: number;
  longitude: number;
}
