import { useState } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAppContext } from '../context/AppContext';
import { getDistanceInMeters, getMonumentName, getMonumentCategory, getMonumentCity, getMonumentImage, getWikimediaDirectUrl } from '../lib/utils';
import { HeartOff, MapPin } from 'lucide-react';
import { MonumentDetailModal } from '../components/MonumentDetailModal';
import { useTranslation } from 'react-i18next';

export function FavoritesPage() {
  const { t } = useTranslation();
  const { location } = useGeolocation();
  const { favorites, monuments } = useAppContext();
  const [selectedMonument, setSelectedMonument] = useState<string | number | null>(null);

  const favoriteMonuments = monuments.filter(m => favorites.includes(String(m.id)));

  const withDist = favoriteMonuments.map(m => {
    const dist = location ? getDistanceInMeters(location.latitude, location.longitude, m.latitude, m.longitude) : Infinity;
    return { ...m, dist };
  });

  const selectedData = monuments.find(m => String(m.id) === String(selectedMonument)) || null;
  const userDist = selectedData && location 
    ? getDistanceInMeters(location.latitude, location.longitude, selectedData.latitude, selectedData.longitude) 
    : undefined;

  return (
    <div className="pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen bg-[#F9F7F2]">
      <h1 className="text-xl font-bold uppercase tracking-tight text-[#1A1A1A] mb-6">{t('app.title')}</h1>
      
      {withDist.length === 0 ? (
        <div className="text-center py-20 px-6 flex flex-col items-center">
          <HeartOff className="w-16 h-16 text-[#E5E1D8] mb-4" />
          <h2 className="text-lg font-bold text-[#444] mb-2">{t('monuments.no_favorites')}</h2>
          <p className="text-[#666] text-sm">{t('monuments.no_favorites_desc')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {withDist.map(monument => {
            const nom = getMonumentName(monument);
            const category = getMonumentCategory(monument);
            const city = getMonumentCity(monument);
            const image = getWikimediaDirectUrl(getMonumentImage(monument));
            
            return (
            <div 
              key={monument.id}
              onClick={() => setSelectedMonument(monument.id)}
              className="group bg-white p-3 rounded-xl border border-transparent hover:border-[#D4AF37] shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-3"
            >
              <img 
                src={image} 
                alt={nom} 
                loading="lazy" 
                referrerPolicy="origin"
                onError={(e) => {
                  const t = e.currentTarget;
                  if (!t.dataset.fallback) { t.dataset.fallback = '1'; t.src = '/placeholder-monument.svg'; }
                }}
                className="w-20 h-20 rounded-lg object-cover bg-gray-100" 
              />
              <div className="flex-1 overflow-hidden flex flex-col justify-center">
                <h4 className="text-sm font-bold text-[#1A1A1A] truncate group-hover:text-[#C1272D] transition-colors">{nom}</h4>
                <div className="text-[10px] text-[#006233] font-semibold mb-1 flex items-center">
                  {'dist' in monument && (monument as any).dist !== Infinity && (
                    <span>{((monument as any).dist / 1000).toFixed(1)} km • </span>
                  )}
                  {category}
                </div>
                <div className="flex gap-1 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-[#666] uppercase font-bold tracking-wider rounded">{city}</span>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {selectedMonument && (
        <MonumentDetailModal 
          monument={selectedData} 
          userDistance={userDist}
          onClose={() => setSelectedMonument(null)} 
        />
      )}
    </div>
  );
}
