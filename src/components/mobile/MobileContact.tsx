import React from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface MobileContactChannel {
  id: string;
  label: string;
  value: string;
  href: string;
  icon: LucideIcon;
  external: boolean;
}

interface MobileContactProps {
  email: string;
  contactHeadline: string;
  contactSupportingText: string;
  primaryCtaLabel: string;
  channels: MobileContactChannel[];
}

export const MobileContact: React.FC<MobileContactProps> = ({
  email,
  contactHeadline,
  contactSupportingText,
  primaryCtaLabel,
  channels,
}) => {
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
    <div className="flex flex-col space-y-6 md:hidden relative z-10">
      {/* Editorial Section Header */}
      <div className="space-y-2.5">
        <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--text-muted)]">
          04 / Contact
        </div>

        <h2 className="font-display font-black text-[34px] min-[390px]:text-[38px] leading-[0.96] tracking-tight text-[var(--text-primary)] break-words">
          {headlineLines.map((line, idx) => (
            <span key={idx} className="block">
              {line}
            </span>
          ))}
        </h2>

        <p className="text-[13.5px] text-[var(--text-secondary)] font-light leading-relaxed whitespace-pre-line">
          {contactSupportingText}
        </p>
      </div>

      {/* Primary High-Contrast Email Action */}
      <div>
        <a
          id="mobile-contact-talk-btn"
          href={`mailto:${email}?subject=Project%20Collaboration%20with%20Afrid`}
          className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] font-display font-bold text-xs tracking-[0.14em] uppercase flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(245,245,245,0.12)] active:scale-[0.98] transition-all"
        >
          <span>{primaryCtaLabel}</span>
          <ArrowRight className="w-4 h-4 shrink-0" />
        </a>
      </div>

      {/* Minimal Hairline-Divided Channel Directory */}
      <div className="border-t border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
        {channels.map((channel) => {
          const Icon = channel.icon;
          return (
            <a
              key={channel.id}
              id={`mobile-contact-channel-${channel.id}`}
              href={channel.href}
              target={channel.external ? '_blank' : undefined}
              rel={channel.external ? 'noopener noreferrer' : undefined}
              className="min-h-[52px] py-3 flex items-center justify-between gap-3 group active:opacity-75 transition-opacity"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 text-[var(--text-primary)] shrink-0" />
                <span className="font-mono text-xs font-semibold tracking-wider text-[var(--text-primary)] shrink-0">
                  {channel.label}
                </span>
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[11px] text-[var(--text-muted)] truncate max-w-[170px]">
                  {channel.value}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
