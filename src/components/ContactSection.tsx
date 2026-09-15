import React from 'react';
import { Mail, Linkedin, Github, Youtube, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react';
import { SITE_INFO, SOCIAL_LINKS } from '../data/siteContent';
import { SiteInfo, SocialLink } from '../types';

interface ContactSectionProps {
  siteInfo?: SiteInfo;
  socialLinks?: SocialLink[];
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  siteInfo = SITE_INFO,
  socialLinks = SOCIAL_LINKS
}) => {
  // Map social links and primary email into contact channels
  const emailLink = socialLinks.find(l => l.platform.toLowerCase() === 'email');
  const linkedinLink = socialLinks.find(l => l.platform.toLowerCase() === 'linkedin');
  const githubLink = socialLinks.find(l => l.platform.toLowerCase() === 'github');
  const youtubeLink = socialLinks.find(l => l.platform.toLowerCase() === 'youtube');

  const contactChannels = [
    {
      id: 'email',
      label: 'EMAIL',
      value: siteInfo.email,
      href: emailLink?.url || `mailto:${siteInfo.email}`,
      icon: Mail,
      iconColor: 'text-[#38BDF8]',
      external: false
    },
    {
      id: 'linkedin',
      label: 'LINKEDIN',
      value: linkedinLink?.label || 'linkedin.com',
      href: linkedinLink?.url || 'https://linkedin.com',
      icon: Linkedin,
      iconColor: 'text-[#38BDF8]',
      external: true
    },
    {
      id: 'github',
      label: 'GITHUB',
      value: githubLink?.label || '@afridaskar',
      href: githubLink?.url || 'https://github.com/afridaskar',
      icon: Github,
      iconColor: 'text-[#38BDF8]',
      external: true
    },
    {
      id: 'youtube',
      label: 'YOUTUBE',
      value: youtubeLink?.label || '@afridtech',
      href: youtubeLink?.url || 'https://youtube.com',
      icon: Youtube,
      iconColor: 'text-red-400',
      external: true
    }
  ];

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

              {/* Exact Primary Heading: LET'S WORK. */}
              <h2 className="text-2xl sm:text-4xl lg:text-[45px] font-display font-black text-white tracking-tight leading-tight sm:leading-none whitespace-nowrap">
                LET'S WORK.
              </h2>

              {/* Short Supporting Text */}
              <div className="space-y-1.5 text-xs sm:text-sm md:text-base text-[#CBD5E1] font-light leading-relaxed max-w-lg">
                <p>
                  Have an idea, automation workflow, AI project, or software build in mind?
                </p>
                <p className="text-[#94A3B8]">
                  Let's build something useful.
                </p>
              </div>

              {/* Primary Action Button: LET'S TALK → */}
              <div className="pt-2">
                <a
                  id="contact-primary-talk-btn"
                  href={`mailto:${SITE_INFO.email}?subject=Project%20Collaboration%20with%20Afrid`}
                  className="group min-h-[44px] px-6 py-2.5 rounded-full bg-[#38BDF8] hover:bg-[#60A5FA] text-[#03050B] font-mono text-xs sm:text-sm font-bold tracking-wider uppercase inline-flex items-center gap-2.5 transition-all shadow-[0_0_20px_rgba(56,189,248,0.25)] active:scale-95 cursor-pointer"
                >
                  <span>LET'S TALK</span>
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
