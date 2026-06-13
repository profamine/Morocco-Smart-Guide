import { MapPin, Navigation, X, Heart, Clock, DollarSign, Accessibility, PlayCircle, StopCircle, RefreshCw } from 'lucide-react';
import { Monument } from '../types';
import { useAppContext } from '../context/AppContext';
import { cn, getMonumentName, getMonumentCategory, getMonumentCity, getMonumentImage, getWikimediaDirectUrl } from '../lib/utils';
// Need motion for animation
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface MonumentDetailModalProps {
  monument: Monument | null;
  onClose: () => void;
  userDistance?: number; // distance in meters
}

export function MonumentDetailModal({ monument, onClose, userDistance }: MonumentDetailModalProps) {
  const { isFavorite, toggleFavorite } = useAppContext();
  const { t, i18n } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!monument) return null;

  const favorite = isFavorite(monument.id);
  const nom = getMonumentName(monument);
  const category = getMonumentCategory(monument);
  const city = getMonumentCity(monument);
  const image = getWikimediaDirectUrl(getMonumentImage(monument));
  const historyText = monument.histoire || monument.history;

  const toggleSpeech = () => {
    if (!window.speechSynthesis) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      const text = `${nom}. ${monument.description || ''} ${historyText || ''}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = i18n.language === 'en' ? 'en-US' : 
                       i18n.language === 'es' ? 'es-ES' : 
                       i18n.language === 'ar' ? 'ar-SA' : 'fr-FR';
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-[#FDFBF7] rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col shadow-2xl border-t-4 border-[#D4AF37]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Image */}
          <div className="relative h-64 shrink-0 border-b-2 border-[#D4AF37]">
            <img
              src={image}
              alt={nom}
              referrerPolicy="origin"
              onError={(e) => {
                const t = e.currentTarget;
                if (!t.dataset.fallback) { t.dataset.fallback = '1'; t.src = '/placeholder-monument.svg'; }
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent">
              <button
                onClick={onClose}
                aria-label="Fermer la modale"
                className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/40 transition text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={() => toggleFavorite(monument.id)}
                aria-label="Ajouter aux favoris"
                className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/40 transition"
              >
                <Heart className={cn("w-6 h-6", favorite ? "fill-[#C1272D] text-[#C1272D]" : "text-white")} />
              </button>
            </div>
            
            <div className="absolute bottom-4 left-4 bg-[#C1272D] text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
              {category}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-[#FDFBF7]">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="text-2xl font-bold text-[#C1272D] font-serif leading-tight">{nom}</h2>
                <div className="flex items-center text-[#666] font-bold tracking-wider uppercase text-[10px] mt-2 border border-[#E5E1D8] px-2 py-1 rounded bg-white w-fit">
                  <MapPin className="w-3 h-3 mr-1 text-[#006233]" />
                  {city}
                  {userDistance !== undefined && (
                    <span className="ml-2 pl-2 border-l border-[#E5E1D8] text-[#D4AF37]">
                      {(userDistance / 1000).toFixed(1)} km
                    </span>
                  )}
                </div>
              </div>
              <a
                href={"https://www.google.com/maps/dir/?api=1&destination=" + monument.latitude + "," + monument.longitude}
                target="_blank"
                rel="noreferrer"
                aria-label="Navigation GPS vers ce lieu"
                className="w-12 h-12 flex items-center justify-center border-2 border-[#D4AF37] text-[#D4AF37] rounded-xl hover:bg-[#D4AF37]/10 transition transform hover:scale-105 shrink-0"
              >
                <Navigation className="w-6 h-6" />
              </a>
            </div>

            <div className="mt-8 space-y-6">
              
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-xs text-[#444]">
                {monument.horaires && (
                  <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-[#E5E1D8]">
                    <Clock className="w-4 h-4 text-[#8B7355]" />
                    <span>{monument.horaires}</span>
                  </div>
                )}
                {monument.tarif && (
                  <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-[#E5E1D8]">
                    <DollarSign className="w-4 h-4 text-[#8B7355]" />
                    <span>{monument.tarif}</span>
                  </div>
                )}
                {monument.accessibilite && (
                  <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-[#E5E1D8]">
                    <Accessibility className="w-4 h-4 text-[#8B7355]" />
                    <span className="truncate">{monument.accessibilite}</span>
                  </div>
                )}
                {monument.dureeVisite && (
                  <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-[#E5E1D8]">
                    <RefreshCw className="w-4 h-4 text-[#8B7355]" />
                    <span>{monument.dureeVisite}</span>
                  </div>
                )}
              </div>

              {/* TTS Button */}
              {'speechSynthesis' in window && (
                <button 
                  onClick={toggleSpeech}
                  className={cn("w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition shadow-sm", isPlaying ? "bg-red-100 text-red-700" : "bg-[#006233]/10 text-[#006233]")}
                >
                  {isPlaying ? <StopCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                  {isPlaying ? t('detail.stop_audio') : t('detail.play_audio')}
                </button>
              )}

              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-[#8B7355]">{t('detail.description')}</h3>
                <p className="text-[#444] leading-relaxed text-sm">
                  {monument.description}
                </p>
              </section>
              
              {historyText && (
                <section>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3 text-[#8B7355]">{t('detail.history')}</h3>
                  <p className="text-[#444] leading-relaxed text-sm">
                    {historyText}
                  </p>
                </section>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
