import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { Settings, Globe, Bell, User, LogOut, Loader2 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut, signInWithPopup, GoogleAuthProvider, linkWithPopup } from 'firebase/auth';

export function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { alertRadius, setAlertRadius, user } = useAppContext();
  const [loading, setLoading] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      if (user && user.isAnonymous) {
        // Link anonymous account to Google to save favorites
        await linkWithPopup(user, provider);
      } else {
        // Normal sign in
        await signInWithPopup(auth, provider);
      }
    } catch (error: any) {
      console.error("Google Auth Error", error);
      if (error.code === 'auth/credential-already-in-use') {
         // User already has an account, so just sign in normally, though they lose anon favorites
         const provider = new GoogleAuthProvider();
         await signInWithPopup(auth, provider);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen bg-[#F9F7F2]">
      <h1 className="text-xl font-bold uppercase tracking-tight text-[#1A1A1A] mb-8">{t('profile.tab')}</h1>

      <div className="space-y-6">
        {/* User Status */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E1D8] flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex overflow-hidden items-center justify-center shrink-0">
            {user && !user.isAnonymous && user.photoURL ? (
              <img src={user.photoURL} alt="Profile" loading="lazy" className="w-full h-full object-cover" />
            ) : (
              <User className="text-gray-500 w-6 h-6" />
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <h3 className="font-bold text-[#1A1A1A] truncate">
              {user && !user.isAnonymous ? (user.displayName || user.email) : t('profile.visitor')}
            </h3>
            <p className="text-sm text-gray-500">
              {user && user.isAnonymous ? t('profile.guest') : (!user ? t('profile.not_connected') : t('profile.connected'))}
            </p>
          </div>
          {user && !user.isAnonymous && (
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition" aria-label={t('profile.auth_logout')}>
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>

        {(!user || user.isAnonymous) && (
          <button 
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full bg-white border border-[#E5E1D8] text-[#1A1A1A] p-3 rounded-xl font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 transition"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" /> : <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
            {!user ? t('profile.auth_login') : t('profile.auth_save')}
          </button>
        )}

        {/* Global Settings */}
        <section className="bg-white rounded-xl shadow-sm border border-[#E5E1D8] overflow-hidden">
          <div className="p-4 border-b border-[#E5E1D8] flex items-center gap-3">
            <Settings className="w-5 h-5 text-[#8B7355]" />
            <h2 className="font-bold uppercase tracking-wider text-[#1A1A1A] text-sm">{t('profile.settings')}</h2>
          </div>
          
          <div className="p-4 border-b border-[#E5E1D8]">
            <div className="flex items-center gap-3 mb-3">
              <Globe className="w-4 h-4 text-gray-400" />
              <label className="text-sm font-semibold text-gray-700">{t('profile.language')}</label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => changeLanguage('fr')}
                className={`p-2 text-xs rounded-lg font-bold transition ${i18n.language === 'fr' ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-600'}`}
              >Français</button>
              <button 
                onClick={() => changeLanguage('en')}
                className={`p-2 text-xs rounded-lg font-bold transition ${i18n.language === 'en' ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-600'}`}
              >English</button>
              <button 
                onClick={() => changeLanguage('es')}
                className={`p-2 text-xs rounded-lg font-bold transition ${i18n.language === 'es' ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-600'}`}
              >Español</button>
              <button 
                onClick={() => changeLanguage('ar')}
                className={`p-2 text-xs rounded-lg font-bold transition ${i18n.language === 'ar' ? 'bg-[#D4AF37] text-white' : 'bg-gray-100 text-gray-600'}`}
              >العربية</button>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Bell className="w-4 h-4 text-gray-400" />
              <label className="text-sm font-semibold text-gray-700">Rayon d'alerte proximité</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[100, 200, 300, 500, 1000, 2000].map((rad) => (
                <button
                  key={rad}
                  onClick={() => setAlertRadius(rad as any)}
                  className={`py-2 text-xs font-bold rounded-lg transition ${alertRadius === rad ? 'bg-[#C1272D] text-white' : 'bg-[#F9F7F2] border border-[#E5E1D8] text-gray-600'}`}
                >
                  {rad >= 1000 ? `${rad / 1000}km` : `${rad}m`}
                </button>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
