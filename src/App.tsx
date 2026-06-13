/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import { HomePage } from './pages/HomePage';
import { BottomNav } from './components/BottomNav';
import { SplashScreen } from './components/SplashScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTranslation } from 'react-i18next';
import { useEffect, Suspense, lazy } from 'react';
import { useNetworkStatus } from './hooks/useNetworkStatus';

const MapPage = lazy(() => import('./pages/MapPage').then(module => ({ default: module.MapPage })));
const ListPage = lazy(() => import('./pages/ListPage').then(module => ({ default: module.ListPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then(module => ({ default: module.FavoritesPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));

function AppContent() {
  const { loading } = useAppContext();
  const { i18n } = useTranslation();
  const isOnline = useNetworkStatus();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <BrowserRouter>
      <div className="font-sans antialiased text-[#1A1A1A] bg-[#FDFBF7] min-h-screen relative">
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 z-[9999] bg-[#8B7355] text-white text-center text-xs py-1.5 font-medium">
            📴 Mode hors ligne — données locales
          </div>
        )}
        <Suspense fallback={<SplashScreen />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/list" element={<ListPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Suspense>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
