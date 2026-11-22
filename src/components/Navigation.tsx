import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, ArrowRight, Github, Linkedin, Youtube, Instagram, Mail, Globe } from 'lucide-react';
import { SOCIAL_LINKS } from '../data/siteContent';

interface NavigationProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  reducedMotion?: boolean;
  onToggleReducedMotion?: () => void;
}

const NAV_ITEMS = [
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'journey', label: 'Journey' },
  { id: 'contact', label: 'Contact' }
];

export const Navigation: React.FC<NavigationProps> = ({
  activeSection,
  onNavigate
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleItemClick = (id: string) => {
    setMobileMenuOpen(false);
    onNavigate(id);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center transition-all duration-300 pointer-events-none ${
          isScrolled ? 'py-2 sm:py-3.5' : 'py-2.5 sm:py-5'
        }`}
      >
        <nav
          className={`pointer-events-auto flex items-center justify-between transition-all duration-300 rounded-full border ${
            isScrolled
              ? 'px-4 sm:px-6 py-1.5 sm:py-2 bg-[var(--bg-canvas-blur)] backdrop-blur-xl border-[var(--border-subtle)] shadow-[0_8px_30px_rgba(0,0,0,0.85)] w-[92%] max-w-5xl'
              : 'px-4 sm:px-7 py-1.5 sm:py-2.5 bg-transparent border-transparent md:bg-[var(--bg-surface-blur)] md:backdrop-blur-md md:border-[var(--border-subtle)] w-[94%] max-w-6xl'
          }`}
        >
          {/* Brand Mark: Afrid. — Clean, bold */}
          <button
            id="nav-brand-mark"
            onClick={() => handleItemClick('hero')}
            className="group flex items-center text-left cursor-pointer focus:outline-none min-h-[44px] py-1"
            aria-label="Return to top"
          >
            <span className="font-display font-black text-lg sm:text-xl tracking-tight text-[var(--text-primary)] group-hover:text-[var(--text-secondary)] transition-colors">
              Afrid<span className="text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">.</span>
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
                  className={`relative px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest transition-all duration-200 cursor-pointer min-h-[40px] flex items-center ${
                    isActive
                      ? 'text-[var(--text-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-glow"
                      className="absolute inset-0 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-sm"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Hamburger Toggle: Touch target min 44x44px */}
          <div className="md:hidden flex items-center">
            <button
              id="nav-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`min-w-[44px] min-h-[44px] p-2.5 rounded-full border text-[var(--text-primary)] flex items-center justify-center cursor-pointer active:scale-95 transition-all ${
                isScrolled
                  ? 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]'
                  : 'border-white/10 bg-[#080808]/60 hover:border-white/25'
              }`}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Fullscreen Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[60] bg-[var(--bg-canvas)]/98 backdrop-blur-2xl flex flex-col justify-between px-6 pt-6 pb-8 md:hidden overflow-y-auto"
          >
            {/* Ambient subtle monochrome glow */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#F5F5F5]/[0.05] blur-3xl pointer-events-none" />

            {/* Top Bar inside Menu: Logo + Close Button */}
            <div className="flex items-center justify-between w-full relative z-10 pb-4 border-b border-[var(--border-subtle)]">
              <span className="font-display font-black text-2xl tracking-tight text-[var(--text-primary)]">
                Afrid<span className="text-[var(--text-muted)]">.</span>
              </span>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="min-w-[44px] min-h-[44px] rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--border-strong)] flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items: Large vertical typography with arrow */}
            <div className="flex flex-col w-full my-auto py-6 relative z-10 divide-y divide-[var(--border-subtle)]">
              {NAV_ITEMS.map((item, index) => {
                const isActive = activeSection === item.id;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.25 }}
                    onClick={() => handleItemClick(item.id)}
                    className="min-h-[58px] py-4 w-full flex items-center justify-between group cursor-pointer text-left focus:outline-none"
                  >
                    <span
                      className={`font-display text-2xl font-bold tracking-tight transition-colors ${
                        isActive
                          ? 'text-[var(--text-primary)]'
                          : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {item.label}
                    </span>
                    <ArrowRight
                      className={`w-5 h-5 transition-transform duration-200 group-hover:translate-x-1 ${
                        isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                      }`}
                    />
                  </motion.button>
                );
              })}
            </div>

            {/* Bottom Footer inside Menu */}
            <div className="w-full relative z-10 pt-5 border-t border-[var(--border-subtle)] flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-mono tracking-widest uppercase text-[var(--text-secondary)] font-semibold">
                  CS UNDERGRADUATE · SLIIT
                </span>
                <span className="font-display font-bold text-base text-[var(--text-primary)]">
                  Afrid Ahmed
                </span>
              </div>

              {/* Social Icons Row */}
              <div className="flex items-center gap-3 pt-1">
                {SOCIAL_LINKS.map((link) => {
                  const plat = link.platform.toLowerCase();
                  return (
                    <a
                      key={link.platform}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-[42px] min-h-[42px] rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] flex items-center justify-center active:scale-95 transition-all"
                      aria-label={link.platform}
                    >
                      {plat === 'github' && <Github className="w-4 h-4" />}
                      {plat === 'linkedin' && <Linkedin className="w-4 h-4" />}
                      {plat === 'youtube' && <Youtube className="w-4 h-4" />}
                      {plat === 'instagram' && <Instagram className="w-4 h-4" />}
                      {plat === 'email' && <Mail className="w-4 h-4" />}
                      {(plat === 'globe' || plat === 'web' || plat === 'website') && <Globe className="w-4 h-4" />}
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Subtle corner ambient glow */}
            <div 
              className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full pointer-events-none opacity-35 bg-[#F5F5F5]/10 blur-3xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
