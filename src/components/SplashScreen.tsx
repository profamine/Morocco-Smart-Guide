import { motion } from 'motion/react';
import { Bot, MapPin } from 'lucide-react';

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[200] bg-[#C1272D] flex flex-col items-center justify-center text-white overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6 relative border-4 border-[#D4AF37]">
          <MapPin className="w-12 h-12 text-[#006233]" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-2 border-2 border-dashed border-[#D4AF37] opacity-60 rounded-3xl"
          />
        </div>
        <h1 className="text-3xl font-black font-serif uppercase tracking-widest text-[#F9F7F2]">Morocco</h1>
        <p className="text-sm font-bold tracking-[0.3em] text-[#D4AF37] uppercase mt-2">Smart Guide</p>
        
        <div className="mt-12 flex items-center justify-center gap-1">
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-[#D4AF37]"/>
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 rounded-full bg-[#D4AF37]"/>
          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 rounded-full bg-[#D4AF37]"/>
        </div>
      </motion.div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #D4AF37 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
    </div>
  );
}
