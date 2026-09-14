import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';
import { SITE_INFO } from '../data/siteContent';

interface NavigationProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  reducedMotion?: boolean;
  onToggleReducedMotion?: () => void;
}

const NAV_ITEMS = [
  { id: 'about', label: 'ABOUT' },
  { id: 'work', label: 'WORK' },
  { id: 'journey', label: 'JOURNEY' },
  { id: 'contact', label: 'CONTACT' }
];

export const Navigation: React.FC<NavigationProps> = ({
  activeSection,
  onNavigate
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleItemClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 pointer-events-none ${
          isScrolled ? 'py-2.5 sm:py-3.5' : 'py-3 sm:py-5'
        }`}
      >
        <nav
          className={`pointer-events-auto flex items-center justify-between transition-all duration-300 rounded-full border ${
            isScrolled
              ? 'px-4 sm:px-6 py-2 bg-[#03050B]/90 backdrop-blur-xl border-[#38BDF8]/20 shadow-[0_8px_30px_rgba(3,5,11,0.85)] w-[92%] max-w-5xl'
              : 'px-4 sm:px-7 py-2.5 bg-[#07101F]/60 backdrop-blur-md border-[#38BDF8]/15 w-[94%] max-w-6xl'
          }`}
        >
          {/* Brand Mark: AFRID only — Clean, bold, zero extra symbols */}
          <button
            id="nav-brand-mark"
            onClick={() => handleItemClick('hero')}
            className="group flex items-center text-left cursor-pointer focus:outline-none min-h-[44px] py-1"
          >
            <span className="font-display font-black text-base sm:text-lg tracking-[0.2em] text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors">
              {SITE_INFO.brandName}
            </span>
          </button>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-1 sm:gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => handleItemClick(item.id)}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs font-mono tracking-widest transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'text-[#38BDF8] font-semibold'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute inset-0 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/30 shadow-[0_0_14px_rgba(56,189,248,0.25)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Hamburger Toggle: AFRID + Menu Icon only */}
          <div className="md:hidden flex items-center">
            <button
              id="nav-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-[44px] min-h-[44px] p-2 rounded-full border border-[#38BDF8]/30 bg-[#07101F]/80 text-[#38BDF8] flex items-center justify-center cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Fullscreen Menu: ABOUT, WORK, JOURNEY, CONTACT */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#03050B]/98 backdrop-blur-2xl flex flex-col justify-center items-center px-6 md:hidden overflow-hidden"
          >
            {/* Ambient celestial glow in mobile menu */}
            <div className="absolute top-1/4 w-56 h-56 rounded-full bg-[#38BDF8]/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center gap-3 w-full max-w-xs relative z-10">
              <span className="font-display font-black text-2xl tracking-[0.25em] text-white uppercase mb-4">
                {SITE_INFO.brandName}
              </span>

              {NAV_ITEMS.map((item, index) => {
                const isActive = activeSection === item.id;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.2 }}
                    onClick={() => handleItemClick(item.id)}
                    className={`min-h-[48px] w-full py-2.5 text-center font-display text-base font-bold tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                      isActive
                        ? 'text-[#38BDF8] bg-[#07101F] border border-[#38BDF8]/40 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                        : 'text-[#CBD5E1] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{item.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
