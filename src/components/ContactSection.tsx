import React from 'react';
import { Mail, Linkedin, Github, Youtube, Instagram, ArrowRight, ArrowUpRight, Sparkles, Globe } from 'lucide-react';
import { SITE_INFO, SOCIAL_LINKS } from '../data/siteContent';
import { SiteInfo, SocialLink } from '../types';

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
  // Map configured social links and primary email into contact channels
  const getIconConfig = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'email':
        return { icon: Mail, iconColor: 'text-[#38BDF8]', external: false };
      case 'linkedin':
        return { icon: Linkedin, iconColor: 'text-[#38BDF8]', external: true };
      case 'github':
        return { icon: Github, iconColor: 'text-[#38BDF8]', external: true };
      case 'youtube':
        return { icon: Youtube, iconColor: 'text-red-400', external: true };
      case 'instagram':
        return { icon: Instagram, iconColor: 'text-pink-400', external: true };
      case 'twitter':
      case 'x':
        return { icon: ArrowUpRight, iconColor: 'text-white', external: true };
      case 'globe':
      case 'web':
      case 'portfolio':
        return { icon: Globe, iconColor: 'text-[#38BDF8]', external: true };
      default:
        return { icon: ArrowUpRight, iconColor: 'text-[#38BDF8]', external: true };
    }
  };

  // Build channels from active social links that have URLs
  const activeLinks = (socialLinks && socialLinks.length > 0 ? socialLinks : SOCIAL_LINKS)
    .filter(l => l && l.url && l.url.trim().length > 0);

  // Guarantee email channel is present
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

  return (
    <section id="contact" className="relative w-full py-12 sm:py-16 md:py-20 px-4 sm:px-8 md:px-12 z-10 scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-6xl mx-auto">
        
        {/* Main Balanced Two-Column Container */}
        <div className="rounded-2xl border border-white/10 bg-[#050816]/75 backdrop-blur-xl p-5 sm:p-8 md:p-10 lg:p-12 relative overflow-hidden shadow-[0_0_40px_rgba(56,189,248,0.03)]">
          {/* Subtle cosmic ambient glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#38BDF8]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          {/* ========================================================================= */}
          {/* 1. MOBILE CONTACT COMPOSITION (< md): SCREEN 5 RECREATION                 */}
          {/* ========================================================================= */}
          <div className="flex flex-col space-y-6 md:hidden">
            {/* Top Label */}
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#38BDF8] uppercase font-semibold">
              <span>04 / CONTACT</span>
            </div>

            {/* Heading: Let's connect. (Screen 5) */}
            <div>
              <h2 className="text-3xl min-[360px]:text-4xl font-display font-extrabold text-white tracking-tight leading-tight">
                Let's connect.
              </h2>
              <p className="text-xs sm:text-sm text-[#CBD5E1] font-light leading-relaxed mt-2">
                I'm always open to new opportunities, collaborations and interesting conversations.
              </p>
            </div>

            {/* Primary Action Button (Wide Cyan Pill) */}
            <div>
              <a
                id="mobile-contact-talk-btn"
                href={`mailto:${siteInfo.email}?subject=Project%20Collaboration%20with%20Afrid`}
                className="w-full min-h-[48px] px-6 py-3 rounded-full bg-[#38BDF8] hover:bg-[#60A5FA] text-[#03050B] font-display font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.3)] active:scale-95 transition-all"
              >
                <span>LET'S TALK</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Channels List Cards */}
            <div className="space-y-2.5 pt-2">
              {contactChannels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <a
                    key={channel.id}
                    id={`mobile-contact-channel-${channel.id}`}
                    href={channel.href}
                    target={channel.external ? '_blank' : undefined}
                    rel={channel.external ? 'noopener noreferrer' : undefined}
                    className="p-3.5 rounded-xl border border-white/10 bg-[#07101F]/80 hover:border-[#38BDF8]/40 flex items-center justify-between transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0B1528] flex items-center justify-center border border-white/5">
                        <Icon className={`w-4 h-4 ${channel.iconColor}`} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-display font-bold text-xs text-white">
                          {channel.label}
                        </span>
                        <span className="text-[11px] font-mono text-[#94A3B8] truncate max-w-[200px]">
                          {channel.value}
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-[#94A3B8]" />
                  </a>
                );
              })}
            </div>

            {/* Social Icons Row (Screen 5) */}
            <div className="pt-2 flex items-center justify-center gap-3">
              {socialLinks.map((link) => {
                const plat = link.platform.toLowerCase();
                return (
                  <a
                    key={link.platform}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full border border-white/10 bg-[#07101F] text-[#CBD5E1] hover:text-[#38BDF8] hover:border-[#38BDF8]/40 flex items-center justify-center active:scale-95 transition-all"
                    aria-label={link.platform}
                  >
                    {plat === 'github' && <Github className="w-4 h-4" />}
                    {plat === 'linkedin' && <Linkedin className="w-4 h-4" />}
                    {plat === 'youtube' && <Youtube className="w-4 h-4" />}
                    {plat === 'instagram' && <Instagram className="w-4 h-4" />}
                    {plat === 'email' && <Mail className="w-4 h-4" />}
                  </a>
                );
              })}
            </div>

            {/* Screen 5 Bottom Note */}
            <div className="pt-4 border-t border-white/5 flex flex-col items-center text-center gap-1">
              <span className="text-xs font-mono text-[#CBD5E1]">
                Made with <span className="text-[#38BDF8]">🩵</span> by Afrid
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">
                © {new Date().getFullYear()} Afrid Ahmed
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. DESKTOP CONTACT COMPOSITION (md+) — 100% PRESERVED                     */}
          {/* ========================================================================= */}
          <div className="hidden md:grid md:grid-cols-12 gap-8 md:gap-10 lg:gap-16 items-start relative z-10">
            
            {/* LEFT COLUMN: Main Heading, Short Copy & Primary Action */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-5 sm:space-y-6">
              
              {/* Top Meta Badge */}
              <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#38BDF8] uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>COLLABORATION & INQUIRIES</span>
              </div>

              {/* Exact Primary Heading */}
              <h2 className="text-2xl min-[360px]:text-3xl sm:text-4xl lg:text-[45px] font-display font-black text-white tracking-tight leading-tight sm:leading-none break-words sm:whitespace-nowrap">
                {contactHeadline}
              </h2>

              {/* Short Supporting Text */}
              <div className="text-xs min-[360px]:text-sm md:text-base text-[#CBD5E1] font-light leading-relaxed max-w-lg whitespace-pre-line">
                {contactSupportingText}
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <a
                  id="contact-primary-talk-btn"
                  href={`mailto:${siteInfo.email}?subject=Project%20Collaboration%20with%20Afrid`}
                  className="group min-h-[46px] px-6 py-2.5 rounded-full bg-[#38BDF8] hover:bg-[#60A5FA] text-[#03050B] font-mono text-xs sm:text-sm font-bold tracking-wider uppercase inline-flex items-center gap-2.5 transition-all shadow-[0_0_20px_rgba(56,189,248,0.25)] active:scale-95 cursor-pointer"
                >
                  <span>{primaryCtaLabel}</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </a>
              </div>

            </div>

            {/* RIGHT COLUMN: Stacked Direct Reach & Platforms List */}
            <div className="md:col-span-5 space-y-2 pt-2 md:pt-0">
              
              {/* Header */}
              <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#94A3B8] font-medium">
                  DIRECT REACH & PLATFORMS
                </span>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>AVAILABLE</span>
                </div>
              </div>

              {/* Refined Vertical Editorial List */}
              <div className="divide-y divide-white/5 font-mono">
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
                        <span className="font-bold text-[#CBD5E1] group-hover:text-white tracking-wider transition-colors">
                          {channel.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#94A3B8] group-hover:text-[#38BDF8] transition-colors">
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
