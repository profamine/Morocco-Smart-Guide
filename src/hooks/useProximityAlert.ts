import { useEffect, useRef, useState } from 'react';
import { Monument, UserLocation } from '../types';
import { getDistanceInMeters } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

export function useProximityAlert(location: UserLocation | null) {
  const { monuments, alertRadius } = useAppContext();
  const notifiedMonuments = useRef<Set<string | number>>(new Set());
  const notificationTimes = useRef<Map<string | number, number>>(new Map()); // Manage 24h delay
  const [nearbyMonument, setNearbyMonument] = useState<Monument | null>(null);

  useEffect(() => {
    if (!location) return;

    for (const monument of monuments) {
      const distance = getDistanceInMeters(
        location.latitude,
        location.longitude,
        monument.latitude,
        monument.longitude
      );

      if (distance <= alertRadius) {
        const lastNotified = notificationTimes.current.get(monument.id);
        const now = Date.now();
        // Notify if never notified, or if it has been 24 hours (86400000 ms)
        if (!lastNotified || (now - lastNotified) > 86400000) {
          if (Notification.permission === 'granted') {
            new Notification('📍 Monument à proximité', {
              body: `${monument.nom || monument.name}\nDécouvrez son histoire.`,
              icon: monument.images ? monument.images[0] : monument.image
            });
          }
          notifiedMonuments.current.add(monument.id);
          notificationTimes.current.set(monument.id, now);
          setNearbyMonument(monument);
        }
      }
    }
  }, [location, monuments, alertRadius]);

  return { nearbyMonument, setNearbyMonument };
}
