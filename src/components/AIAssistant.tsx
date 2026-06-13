import { useState } from 'react';
import { Send, Bot, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import { useAppContext } from '../context/AppContext';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export function AIAssistant({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { t } = useTranslation();
  const { user } = useAppContext();
  const [messages, setMessages] = useState<{role: 'user' | 'model', content: string}[]>([
    { role: 'model', content: t('ai.hello') }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
      alert('Connexion échouée');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const user = auth.currentUser;
    if (!user) {
      setMessages(prev => [...prev, { role: 'model', content: t('ai.error_login') }]);
      return;
    }

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg, history: messages })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'model', content: data.text || t('ai.error_generic') }]);
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model', content: `${t('ai.error_prefix')} ${e.message || 'Connexion échouée'}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl border-2 border-[#D4AF37] z-50 flex flex-col overflow-hidden"
          style={{ height: '60vh', maxHeight: '500px' }}
        >
          <div className="bg-[#C1272D] text-white p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <h3 className="font-bold text-sm uppercase tracking-wider">{t('ai.title')}</h3>
            </div>
            <button onClick={onClose} aria-label="Fermer l'assistant virtuel"><X className="w-5 h-5" /></button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F9F7F2]" dir="auto">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-[#006233] text-white rounded-tr-none' : 'bg-white border border-[#E5E1D8] text-[#1A1A1A] rounded-tl-none shadow-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-2xl text-sm bg-white border border-[#E5E1D8] rounded-tl-none">
                  <span className="animate-pulse">...</span>
                </div>
              </div>
            )}
          </div>
          
          {!user || user.isAnonymous ? (
            <div className="p-4 bg-white border-t border-[#E5E1D8] text-center" dir="auto">
              <p className="text-sm text-[#666] mb-3">{t('ai.auth_required')}</p>
              <button
                onClick={handleLogin}
                className="w-full bg-white border border-[#E5E1D8] text-[#1A1A1A] p-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 transition"
              >
                {loginLoading ? <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" /> : <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>}
                {t('profile.auth_login')}
              </button>
            </div>
          ) : (
            <div className="p-3 bg-white border-t border-[#E5E1D8] flex gap-2" dir="auto">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="flex-1 border border-[#E5E1D8] rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#D4AF37]"
                placeholder={t('ai.placeholder')}
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                aria-label="Envoyer le message"
                className="p-2 bg-[#D4AF37] text-white rounded-full disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
