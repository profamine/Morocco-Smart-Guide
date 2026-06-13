import React, { createContext, useContext, useState, useEffect } from 'react';
import { Monument, AlertRadius } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { MONUMENTS } from '../data/monuments';

interface AppContextType {
  user: User | null;
  loading: boolean;
  monuments: Monument[];
  favorites: string[];
  alertRadius: AlertRadius;
  setAlertRadius: (radius: AlertRadius) => void;
  toggleFavorite: (id: string | number) => void;
  isFavorite: (id: string | number) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [monuments, setMonuments] = useState<Monument[]>(
    MONUMENTS.map(m => ({ ...m, id: String(m.id) }))
  );
  const [favorites, setFavorites] = useState<string[]>([]);
  const [alertRadius, setAlertRadius] = useState<AlertRadius>(200);

  // Initial Data & Auth Sync
  useEffect(() => {
    // 1. Auth Listener
    const timeout = setTimeout(() => setLoading(false), 3000);
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(timeout);
      setUser(currentUser);
      setLoading(false);
    });

    // 2. Fetch Monuments
    const unsubscribeMonuments = onSnapshot(
      collection(db, 'monuments_v2'),
      { includeMetadataChanges: false },
      (snapshot) => {
        if (!snapshot.empty) {
          const loaded: Monument[] = [];
          snapshot.forEach(docSnap => loaded.push({ id: docSnap.id, ...docSnap.data() } as Monument));
          setMonuments(loaded);
        }
      },
      (error) => console.warn('Firestore offline, using local data:', error)
    );

    // 3. Seed database if empty
    getDoc(doc(db, 'meta', 'app_v2')).then(async (docSnap) => {
      if (!docSnap.exists() || !docSnap.data().seeded) {
        import('../data/seed').then(m => m.seedDatabase());
      } else if (docSnap.data().seedVersion !== 4) {
        import('../data/seed').then(m => m.seedDatabase());
      }
    }).catch(e => console.warn('Could not check seed status:', e));

    return () => { clearTimeout(timeout); unsubscribeAuth(); unsubscribeMonuments(); };
  }, []);

  // Sync Favorites per User
  useEffect(() => {
    if (!user) {
      try {
        const localFavs = JSON.parse(localStorage.getItem('localFavs') || '[]');
        setFavorites(localFavs);
      } catch (e) {
        setFavorites([]);
      }
      return;
    }
    const q = query(collection(db, 'favoris'), where('userId', '==', user.uid));
    const unsubscribeFavs = onSnapshot(q, (snapshot) => {
      let favs: string[] = [];
      snapshot.forEach(docSnap => {
        favs.push(docSnap.data().monumentId);
      });
      setFavorites(favs);
    }, (error) => {
      console.error("Error fetching favorites:", error);
    });
    return () => unsubscribeFavs();
  }, [user]);

  const toggleFavorite = async (id: string | number) => {
    const strId = String(id);
    
    if (favorites.includes(strId)) {
      // Remove
      setFavorites(prev => {
        const newFavs = prev.filter(fid => fid !== strId);
        if (!user) localStorage.setItem('localFavs', JSON.stringify(newFavs));
        return newFavs;
      }); // Optimistic UI
      
      if (user) {
        const favId = `${user.uid}_${strId}`;
        try {
          await deleteDoc(doc(db, 'favoris', favId));
        } catch (e) {
          console.error("Failed to remove favorite", e);
        }
      }
    } else {
      // Add
      setFavorites(prev => {
        const newFavs = [...prev, strId];
        if (!user) localStorage.setItem('localFavs', JSON.stringify(newFavs));
        return newFavs;
      }); // Optimistic UI
      
      if (user) {
        const favId = `${user.uid}_${strId}`;
        try {
          await setDoc(doc(db, 'favoris', favId), {
            userId: user.uid,
            monumentId: strId,
            createdAt: Date.now()
          });
        } catch (e) {
          console.error("Failed to add favorite", e);
        }
      }
    }
  };

  const isFavorite = (id: string | number) => favorites.includes(String(id));

  return (
    <AppContext.Provider value={{ 
      user, loading, monuments, favorites, toggleFavorite, isFavorite, alertRadius, setAlertRadius 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
}
