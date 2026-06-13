import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Monument } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert degrees to radians
function toRad(value: number) {
  return (value * Math.PI) / 180;
}

// Returns distance in meters
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getMonumentName(monument: Monument | any): string {
  if (!monument) return '';
  return monument.nom || monument.name || '';
}

export function getMonumentCity(monument: Monument | any): string {
  if (!monument) return '';
  return monument.ville || monument.city || '';
}

export function getMonumentCategory(monument: Monument | any): string {
  if (!monument) return '';
  return monument.categorie || monument.category || '';
}

export function getMonumentImage(monument: Monument | any): string {
  if (!monument) return '';
  if (monument.images && monument.images.length > 0) return monument.images[0];
  return monument.image || '';
}

export function getWikimediaDirectUrl(url: string): string {
  if (!url) return '/placeholder-monument.svg';
  if (url.includes('Special:FilePath/')) {
    const filename = url.split('Special:FilePath/')[1];
    return `https://commons.wikimedia.org/w/index.php?title=Special:Redirect/file/${filename}&width=800`;
  }
  return url;
}
