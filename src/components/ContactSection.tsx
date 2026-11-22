import React from 'react';
import { Mail, Linkedin, Github, Youtube, Instagram, ArrowRight, ArrowUpRight, Sparkles, Globe } from 'lucide-react';
import { SITE_INFO, SOCIAL_LINKS } from '../data/siteContent';
import { SiteInfo, SocialLink } from '../types';
import { MobileContact } from './mobile/MobileContact';

interface ContactSectionProps {
  siteInfo?: SiteInfo;
  socialLinks?: SocialLink[];
  contactHeadline?: string;
  contactSupportingText?: string;
  primaryCtaLabel?: string;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  siteInfo = SITE_INFO,
  socialLinks = SOCIAL_LINKS,
  contactHeadline = "LET'S WORK.",
  contactSupportingText = "Have an idea, automation workflow, AI project, or software build in mind?\nLet's build something useful.",
  primaryCtaLabel = "LET'S TALK"
}) => {
  const getIconConfig = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'email':
        return { icon: Mail, iconColor: 'text-[var(--text-primary)]', external: false };
      case 'linkedin':
        return { icon: Linkedin, iconColor: 'text-[var(--text-primary)]', external: true };
      case 'github':
        return { icon: Github, iconColor: 'text-[var(--text-primary)]', external: true };
      case 'youtube':
        return { icon: Youtube, iconColor: 'text-[var(--text-primary)]', external: true };
      case 'instagram':
        return { icon: Instagram, iconColor: 'text-[var(--text-primary)]', external: true };
      case 'twitter':
      case 'x':
        return { icon: ArrowUpRight, iconColor: 'text-[var(--text-primary)]', external: true };
      case 'globe':
      case 'web':
      case 'portfolio':
        return { icon: Globe, iconColor: 'text-[var(--text-primary)]', external: true };
      default:
        return { icon: ArrowUpRight, iconColor: 'text-[var(--text-primary)]', external: true };
    }
  };

  const activeLinks = (socialLinks && socialLinks.length > 0 ? socialLinks : SOCIAL_LINKS)
    .filter(l => l && l.url && l.url.trim().length > 0);

  const hasEmail = activeLinks.some(l => l.platform.toLowerCase() === 'email');
  const linksToRender: SocialLink[] = hasEmail
    ? activeLinks
    : [
        {
          platform: 'Email',
          label: siteInfo.email,
          url: `mailto:${siteInfo.email}`,
          iconName: 'Mail',
        },
        ...activeLinks,
      ];

  const contactChannels = linksToRender.map(link => {
    const config = getIconConfig(link.platform);
    return {
      id: link.platform.toLowerCase(),
      label: link.platform.toUpperCase(),
      value: link.label || link.url.replace(/^https?:\/\//, ''),
      href: link.url,
      icon: config.icon,
      iconColor: config.iconColor,
      external: config.external,
    };
  });

  const headlineLines = React.useMemo(() => {
    const trimmed = (contactHeadline || "LET'S WORK.").trim();
    if (trimmed.includes('\n')) {
      return trimmed
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
    }
    if (/^let['’]s\s+work\.?$/i.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      const secondLine = parts[1].endsWith('.') ? parts[1] : `${parts[1]}.`;
      return [parts[0], secondLine];
    }
    return [trimmed];
  }, [contactHeadline]);

  return (
    <section id="contact" className="relative w-full py-12 sm:py-16 md:py-20 px-4 sm:px-8 md:px-12 z-10 scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-6xl mx-auto">

        {/* Main Balanced Two-Column Container */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-blur)] backdrop-blur-xl p-5 sm:p-8 md:p-10 lg:p-12 relative overflow-hidden shadow-[var(--shadow-card)] transition-colors duration-300">
          {/* Subtle monochrome ambient glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#F5F5F5]/[0.04] rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          {/* ========================================================================= */}
          {/* 1. MOBILE CONTACT COMPOSITION (< md)                                      */}
          {/* ========================================================================= */}
          <MobileContact
            email={siteInfo.email}
            contactHeadline={contactHeadline}
            contactSupportingText={contactSupportingText}
            primaryCtaLabel={primaryCtaLabel}
            channels={contactChannels}
          />

          {/* ========================================================================= */}
          {/* 2. DESKTOP CONTACT COMPOSITION (md+)                                      */}
          {/* ========================================================================= */}
          <div className="hidden md:grid md:grid-cols-12 gap-8 md:gap-10 lg:gap-16 items-start relative z-10">

            <div className="md:col-span-7 min-w-0 flex flex-col justify-between space-y-5 sm:space-y-6">

              <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[var(--text-secondary)] uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                <span>COLLABORATION & INQUIRIES</span>
              </div>

              <h2 className="text-3xl md:text-4xl lg:text-[clamp(2.1rem,3.3vw,2.8125rem)] font-display font-black text-[var(--text-primary)] tracking-tight leading-[0.96] lg:leading-none break-words lg:whitespace-nowrap">
                {headlineLines.map((line, idx) => (
                  <span key={idx} className="block lg:inline">
                    {idx > 0 && <span className="hidden lg:inline"> </span>}
                    {line}
                  </span>
                ))}
              </h2>

              <div className="text-xs min-[360px]:text-sm md:text-base text-[var(--text-secondary)] font-light leading-relaxed max-w-lg whitespace-pre-line">
                {contactSupportingText}
              </div>

              <div className="pt-2">
                <a
                  id="contact-primary-talk-btn"
                  href={`mailto:${siteInfo.email}?subject=Project%20Collaboration%20with%20Afrid`}
                  className="group min-h-[46px] px-6 py-2.5 rounded-full bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] font-mono text-xs sm:text-sm font-bold tracking-wider uppercase inline-flex items-center gap-2.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <span>{primaryCtaLabel}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </a>
              </div>

            </div>

            <div className="md:col-span-5 min-w-0 space-y-2 pt-2 md:pt-0">

              <div className="border-b border-[var(--border-subtle)] pb-3 flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--text-muted)] font-medium">
                  DIRECT REACH & PLATFORMS
                </span>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--text-primary)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)] animate-pulse" />
                  <span>AVAILABLE</span>
                </div>
              </div>

              <div className="divide-y divide-[var(--border-subtle)] font-mono">
                {contactChannels.map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <a
                      key={channel.id}
                      id={`contact-channel-${channel.id}`}
                      href={channel.href}
                      target={channel.external ? '_blank' : undefined}
                      rel={channel.external ? 'noopener noreferrer' : undefined}
                      className="group min-h-[46px] py-2.5 sm:py-3 flex items-center justify-between text-xs sm:text-sm transition-all duration-200 hover:pl-1 active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${channel.iconColor} transition-transform duration-200 group-hover:scale-110`} />
                        <span className="font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] tracking-wider transition-colors">
                          {channel.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                        <span className="hidden sm:inline font-light truncate max-w-[150px]">
                          {channel.value}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </a>
                  );
                })}
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
