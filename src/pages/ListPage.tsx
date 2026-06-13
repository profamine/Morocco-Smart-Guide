import { useState, useMemo } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAppContext } from '../context/AppContext';
import { getDistanceInMeters, getMonumentName, getMonumentCategory, getMonumentCity, getMonumentImage, getWikimediaDirectUrl } from '../lib/utils';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import { MonumentDetailModal } from '../components/MonumentDetailModal';
import { useTranslation } from 'react-i18next';

export function ListPage() {
  const { location } = useGeolocation();
  const { monuments } = useAppContext();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedMonument, setSelectedMonument] = useState<string | number | null>(null);
  const { t } = useTranslation();

  const categories = useMemo(() => Array.from(new Set(monuments.map(m => getMonumentCategory(m)))), [monuments]);

  const filteredMonuments = useMemo(() => {
    let result = monuments;

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(m => 
        getMonumentName(m).toLowerCase().includes(s) || 
        getMonumentCity(m).toLowerCase().includes(s)
      );
    }

    if (categoryFilter) {
      result = result.filter(m => getMonumentCategory(m) === categoryFilter);
    }

    // Add distances if location available
    const withDist = result.map(m => {
      const dist = location ? getDistanceInMeters(location.latitude, location.longitude, m.latitude, m.longitude) : Infinity;
      return { ...m, dist };
    });

    if (location) {
      withDist.sort((a, b) => a.dist - b.dist);
    }

    return withDist;
  }, [search, categoryFilter, location, monuments]);

  const selectedData = monuments.find(m => m.id === selectedMonument) || null;
  const userDist = selectedData && location 
    ? getDistanceInMeters(location.latitude, location.longitude, selectedData.latitude, selectedData.longitude) 
    : undefined;


  return (
    <div className="pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen bg-[#F9F7F2]">
      <h1 className="text-xl font-bold uppercase tracking-tight text-[#1A1A1A] mb-6">{t('list.tab')}</h1>
      
      {/* Search Bar */}
      <div className="relative mb-6 shadow-sm" dir="auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-[#8B7355]" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-[#E5E1D8] rounded-full text-sm leading-5 bg-white placeholder-[#8B7355]/60 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition"
          placeholder={t('search.placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setCategoryFilter('')}
          className={categoryFilter === '' ? 'shrink-0 px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition bg-[#D4AF37] text-white shadow-sm' : 'shrink-0 px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition bg-white border border-[#E5E1D8] text-[#666] hover:bg-gray-50'}
        >
          Tous
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={categoryFilter === cat ? 'shrink-0 px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition bg-[#D4AF37] text-white shadow-sm' : 'shrink-0 px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition bg-white border border-[#E5E1D8] text-[#666] hover:bg-gray-50'}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredMonuments.length === 0 ? (
          <div className="text-center py-12 text-[#666]">
            Aucun résultat trouvé pour votre recherche.
          </div>
        ) : (
          filteredMonuments.map(monument => {
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
          })
        )}
      </div>

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
