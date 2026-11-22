import React from 'react';
import { ArrowUp, Github, Linkedin, Youtube, Mail } from 'lucide-react';
import { SOCIAL_LINKS, SITE_INFO } from '../data/siteContent';
import { SiteInfo, SocialLink } from '../types';

interface FooterProps {
  siteInfo?: SiteInfo;
  socialLinks?: SocialLink[];
}

export const Footer: React.FC<FooterProps> = ({
  siteInfo = SITE_INFO,
  socialLinks = SOCIAL_LINKS
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative w-full py-12 sm:py-16 px-4 sm:px-8 md:px-12 z-10 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)]/90 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center space-y-5 sm:space-y-6 relative z-10">

        {/* Brand Wordmark & Role */}
        <div className="space-y-1">
          <div className="font-display font-black text-2xl sm:text-3xl tracking-[0.22em] text-[var(--text-primary)]">
            {siteInfo.brandName || SITE_INFO.brandName}
          </div>
          <p className="font-mono text-xs sm:text-sm tracking-wider text-[var(--text-secondary)]">
            Engineer · Creator · Future Builder
          </p>
        </div>

        {/* Social Links */}
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-5 font-mono text-xs text-[var(--text-secondary)]">
          {socialLinks.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-3 py-2 hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
            >
              {link.platform.toLowerCase() === 'github' && <Github className="w-3.5 h-3.5" />}
              {link.platform.toLowerCase() === 'linkedin' && <Linkedin className="w-3.5 h-3.5" />}
              {link.platform.toLowerCase() === 'youtube' && <Youtube className="w-3.5 h-3.5" />}
              {link.platform.toLowerCase() === 'email' && <Mail className="w-3.5 h-3.5" />}
              <span>{link.platform}</span>
            </a>
          ))}
        </div>

        {/* Bottom Orbit Meta & Top of Universe */}
        <div className="pt-3 border-t border-[var(--border-subtle)] w-full max-w-md flex items-center justify-between text-[11px] font-mono text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)]" />
            <span>ORBIT: CS 2026–2030</span>
          </div>

          <button
            onClick={scrollToTop}
            className="min-h-[44px] flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <span>TOP OF UNIVERSE</span>
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>

        {/* Copyright (Hidden on mobile since Contact Section displays it) */}
        <div className="hidden md:block text-[10px] font-mono text-[var(--text-muted)]">
          © {new Date().getFullYear()} Afrid Ahmed. All rights reserved.
        </div>

      </div>
    </footer>
  );
};
