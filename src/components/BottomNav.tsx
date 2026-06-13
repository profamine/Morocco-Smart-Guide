import { NavLink } from 'react-router-dom';
import { Home, Map, List, Heart, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';

export function BottomNav() {
  const { t } = useTranslation();
  const links = [
    { to: '/', icon: Home, label: t('home.tab') },
    { to: '/map', icon: Map, label: t('map.tab') },
    { to: '/list', icon: List, label: t('list.tab') },
    { to: '/favorites', icon: Heart, label: t('favorites.tab') },
    { to: '/profile', icon: User, label: t('profile.tab') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] border-t border-white/5 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center w-full h-full space-y-1',
                isActive ? 'text-[#D4AF37]' : 'text-gray-400 hover:text-white'
              )
            }
          >
            <link.icon className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
