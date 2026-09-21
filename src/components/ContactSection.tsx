import React from 'react';
import { Mail, Linkedin, Github, Youtube, Instagram, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
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
    <section id="contact" className="relative w-full py-12 sm:py-16 md:py-20 px-4 sm:px-8 md:px-12 z-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Main Balanced Two-Column Container */}
        <div className="rounded-2xl border border-white/10 bg-[#050816]/75 backdrop-blur-xl p-6 sm:p-8 md:p-10 lg:p-12 relative overflow-hidden shadow-[0_0_40px_rgba(56,189,248,0.03)]">
          {/* Subtle cosmic ambient glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#38BDF8]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 lg:gap-16 items-start relative z-10">
            
            {/* LEFT COLUMN: Main Heading, Short Copy & Primary Action */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-6">
              
              {/* Top Meta Badge */}
              <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#38BDF8] uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>COLLABORATION & INQUIRIES</span>
              </div>

              {/* Exact Primary Heading */}
              <h2 className="text-2xl sm:text-4xl lg:text-[45px] font-display font-black text-white tracking-tight leading-tight sm:leading-none whitespace-nowrap">
                {contactHeadline}
              </h2>

              {/* Short Supporting Text */}
              <div className="text-xs sm:text-sm md:text-base text-[#CBD5E1] font-light leading-relaxed max-w-lg whitespace-pre-line">
                {contactSupportingText}
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <a
                  id="contact-primary-talk-btn"
                  href={`mailto:${siteInfo.email}?subject=Project%20Collaboration%20with%20Afrid`}
                  className="group min-h-[44px] px-6 py-2.5 rounded-full bg-[#38BDF8] hover:bg-[#60A5FA] text-[#03050B] font-mono text-xs sm:text-sm font-bold tracking-wider uppercase inline-flex items-center gap-2.5 transition-all shadow-[0_0_20px_rgba(56,189,248,0.25)] active:scale-95 cursor-pointer"
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
                      className="group py-3 flex items-center justify-between text-xs sm:text-sm transition-all duration-200 hover:pl-1"
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
