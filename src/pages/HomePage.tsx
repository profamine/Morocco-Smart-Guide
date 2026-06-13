import { useState, lazy, Suspense } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { useProximityAlert } from '../hooks/useProximityAlert';
import { useAppContext } from '../context/AppContext';
import { getDistanceInMeters, cn, getMonumentName, getMonumentCategory, getMonumentCity, getMonumentImage, getWikimediaDirectUrl } from '../lib/utils';
import { MonumentDetailModal } from '../components/MonumentDetailModal';
import { MapPin, Bell, Compass, Bot } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';

const AIAssistant = lazy(() => import('../components/AIAssistant').then(m => ({ default: m.AIAssistant })));

export function HomePage() {
  const { location, error } = useGeolocation();
  const { monuments } = useAppContext();
  const { nearbyMonument, setNearbyMonument } = useProximityAlert(location);
  const [selectedMonument, setSelectedMonument] = useState<string | number | null>(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const { t, i18n } = useTranslation();

  // Ask for notification permission early
  const requestNotify = () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const selectedData = monuments.find(m => m.id === selectedMonument) || null;
  const userDist = selectedData && location 
    ? getDistanceInMeters(location.latitude, location.longitude, selectedData.latitude, selectedData.longitude) 
    : undefined;

  // Process nearby for the list
  const monumentsWithDist = monuments.map(m => {
    const dist = location ? getDistanceInMeters(Math.max(-90, Math.min(90, location.latitude)), Math.max(-180, Math.min(180, location.longitude)), m.latitude, m.longitude) : Infinity;
    return { ...m, dist };
  }).sort((a,b) => a.dist - b.dist);

  const nearest = monumentsWithDist.filter(m => m.dist < 50000); // within 50km

  return (
    <div className="pb-24 pt-8 px-4 max-w-md mx-auto">
      <header className="mb-6 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#C1272D] rounded-lg flex items-center justify-center p-1 border-2 border-[#D4AF37]">
            <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8"><path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z"/></svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase text-[#1A1A1A]">Morocco Smart Guide</h1>
            <p className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest">Discovery Hub</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAssistant(true)}
            aria-label="Ouvrir l'assistant virtuel"
            className="p-2 bg-[#006233] shadow-sm rounded-full text-white hover:bg-[#004e28] transition relative"
          >
            <Bot className="w-5 h-5" />
          </button>
          <button 
            onClick={requestNotify}
            aria-label="Activer les notifications"
            className="p-2 bg-white border border-[#E5E1D8] shadow-sm rounded-full text-[#666] hover:text-[#C1272D] transition relative"
          >
            <Bell className="w-5 h-5" />
            {nearbyMonument && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#C1272D] rounded-full border border-white"></span>
            )}
          </button>
        </div>
      </header>

      {/* Geolocation Status */}
      <div className={cn("p-4 rounded-xl mb-6 flex-col gap-3 flex shadow-sm border", location ? "bg-white border-[#E5E1D8]" : "bg-[#F9F7F2] border-[#D4AF37]")}>
        <div className="flex items-center">
            <div className={cn("p-2.5 rounded-lg mr-4", location ? "bg-[#006233]/10 text-[#006233]" : "bg-[#D4AF37]/10 text-[#D4AF37] animate-pulse")}>
            <Compass className="w-5 h-5" />
            </div>
            <div>
            <h3 className="font-bold text-xs uppercase tracking-widest text-[#1A1A1A]">{t('home.gps_status')}</h3>
            <p className="text-xs text-[#666]">
                {error ? error : location ? t('home.gps_active') : t('home.gps_search')}
            </p>
            </div>
        </div>
        {error && (
            <div className="pt-2 border-t border-[#D4AF37]/30">
                <label className="text-[10px] font-bold text-[#8B7355] uppercase tracking-widest mb-1 block">{t('home.fallback_city')}</label>
                <select className="w-full bg-white border border-[#D4AF37] rounded-lg text-sm p-2 outline-none">
                    <option>Marrakech</option>
                    <option>Fès</option>
                    <option>Rabat</option>
                    <option>Tanger</option>
                    <option>Agadir</option>
                </select>
            </div>
        )}
      </div>

      {nearbyMonument && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-[#D4AF37] p-5 rounded-xl shadow-lg mb-8 cursor-pointer relative overflow-hidden"
          onClick={() => setSelectedMonument(nearbyMonument.id)}
        >
          <div className="flex items-center gap-2 mb-3 text-[#006233] font-bold text-[10px] uppercase tracking-widest">
            <span className="w-2 h-2 bg-[#006233] rounded-full animate-pulse"></span>
            {t('home.live_alert')}
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#C1272D] mb-1">{getMonumentName(nearbyMonument)}</h3>
          <p className="text-[#666] text-sm">{t('home.tap_details')}</p>
        </motion.div>
      )}

      {/* Suggestions */}
      <div>
        <h2 className="text-sm font-black uppercase tracking-[0.2em] mb-4 text-[#8B7355]">{t('home.nearby')}</h2>
        
        <div className="grid gap-3">
          {(location && nearest.length > 0 ? nearest.slice(0, 3) : monuments.slice(0, 3)).map(monument => {
            const nom = getMonumentName(monument);
            const category = getMonumentCategory(monument);
            const city = getMonumentCity(monument);
            const image = getWikimediaDirectUrl(getMonumentImage(monument));
            
            return (
            <div 
              key={monument.id} 
              className="group bg-white p-3 rounded-xl border border-transparent hover:border-[#D4AF37] shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-3"
              onClick={() => setSelectedMonument(monument.id)}
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
                className="w-16 h-16 rounded-lg object-cover bg-gray-100" 
              />
              <div className="flex-1 overflow-hidden flex flex-col justify-center">
                <h4 className="text-xs font-bold text-[#1A1A1A] truncate group-hover:text-[#C1272D] transition-colors">{nom}</h4>
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
          )})}
        </div>
      </div>

      {selectedMonument && (
        <MonumentDetailModal 
          monument={selectedData} 
          userDistance={userDist}
          onClose={() => {
            setSelectedMonument(null);
            if (nearbyMonument && String(nearbyMonument.id) === String(selectedMonument)) {
              setNearbyMonument(null);
            }
          }} 
        />
      )}

      {showAssistant && (
        <Suspense fallback={null}>
          <AIAssistant isOpen={showAssistant} onClose={() => setShowAssistant(false)} />
        </Suspense>
      )}
    </div>
  );
}
