import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useAppContext } from '../context/AppContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { MonumentDetailModal } from '../components/MonumentDetailModal';
import { getDistanceInMeters, getMonumentName, getMonumentCategory } from '../lib/utils';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

import { useTranslation } from 'react-i18next';

const categoryColors: Record<string, string> = {
  "Mosquée": "red",
  "Jardin": "green",
  "Kasbah": "orange",
  "Ruines Romaines": "grey",
  "Médina": "blue",
  "Médersa": "violet",
};

const iconCache: Record<string, L.Icon> = {};
function getCategoryIcon(category: string) {
  const color = categoryColors[category] || "red";
  if (!iconCache[color]) {
    iconCache[color] = new L.Icon({
      iconUrl: `https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  }
  return iconCache[color];
}

// User Icon
const userIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export function MapPage() {
  const { location } = useGeolocation();
  const { monuments } = useAppContext();
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const { t } = useTranslation();

  const center: [number, number] = location 
    ? [location.latitude, location.longitude] 
    : [31.7917, -7.0926]; // Center of Morocco

  const selectedData = useMemo(() => monuments.find(m => String(m.id) === String(selectedId)) || null, [selectedId, monuments]);
  const userDist = selectedData && location 
    ? getDistanceInMeters(location.latitude, location.longitude, selectedData.latitude, selectedData.longitude) 
    : undefined;

  return (
    <div className="h-screen w-full relative pb-16 flex flex-col">
      <div className="p-4 bg-[#C1272D] text-white shadow-md z-10 absolute top-0 left-0 right-0 border-b-2 border-[#D4AF37]">
        <h1 className="text-xl font-bold uppercase tracking-tight">{t('map.tab')}</h1>
      </div>
      
      <div className="flex-1 z-0 mt-14 relative">
        <div className="absolute bottom-6 left-4 z-[400] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 text-xs space-y-1.5 max-w-[160px]">
          <h4 className="font-bold uppercase tracking-widest text-[10px] text-[#8B7355] mb-1">Légende</h4>
          {Object.entries(categoryColors).map(([cat, color]) => (
            <div key={cat} className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full inline-block shrink-0" 
                style={{ backgroundColor: color === 'grey' ? '#888' : color }} 
              />
              <span className="truncate">{cat}</span>
            </div>
          ))}
        </div>
        <MapContainer 
          center={center} 
          zoom={location ? 12 : 5} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />

          {location && (
            <Marker position={[location.latitude, location.longitude]} icon={userIcon}>
              <Popup>Votre position</Popup>
            </Marker>
          )}

          <MarkerClusterGroup
            chunkedLoading
            showCoverageOnHover={false}
            maxClusterRadius={40}
          >
            {monuments.map(monument => (
              <Marker 
                key={monument.id} 
                position={[monument.latitude, monument.longitude]}
                icon={getCategoryIcon(getMonumentCategory(monument))}
                eventHandlers={{
                  click: () => {
                    setSelectedId(monument.id);
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -35]} opacity={0.9}>
                  {getMonumentName(monument)}
                </Tooltip>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>

      <MonumentDetailModal 
        monument={selectedData} 
        userDistance={userDist}
        onClose={() => setSelectedId(null)} 
      />
    </div>
  );
}
