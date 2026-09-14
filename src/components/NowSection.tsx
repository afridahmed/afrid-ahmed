import React from 'react';
import { Radio, BookOpen, Terminal, Cpu, Video, Wrench } from 'lucide-react';
import { NowFocusItem, NowContent } from '../types';
import { NOW_CONTENT } from '../data/siteContent';

interface NowSectionProps {
  content?: NowContent;
  items?: NowFocusItem[];
}

export const NowSection: React.FC<NowSectionProps> = ({ 
  content = NOW_CONTENT,
  items 
}) => {
  const itemList: NowFocusItem[] = Array.isArray(items)
    ? items
    : Array.isArray((items as any)?.items)
    ? (items as any).items
    : content?.items || [];

  const getIcon = (category: string) => {
    switch (category) {
      case 'Academic Focus':
        return <BookOpen className="w-4 h-4 text-[#38BDF8]" />;
      case 'Exploration':
        return <Cpu className="w-4 h-4 text-[#60A5FA]" />;
      case 'Hardware':
        return <Wrench className="w-4 h-4 text-[#38BDF8]" />;
      case 'Media & Creation':
        return <Video className="w-4 h-4 text-emerald-400" />;
      default:
        return <Terminal className="w-4 h-4 text-[#38BDF8]" />;
    }
  };

  return (
    <section id="now" className="relative w-full py-16 sm:py-24 px-4 sm:px-8 md:px-12 z-10">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-4 sm:pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#38BDF8] uppercase mb-1">
              <Radio className="w-3.5 h-3.5 animate-pulse text-[#38BDF8]" />
              <span>{content.badge}</span>
            </div>
            <h3 className="text-3xl sm:text-5xl font-display font-extrabold text-white tracking-tight">
              {content.title}
            </h3>
            <p className="text-xs sm:text-sm font-mono text-[#94A3B8] mt-1">
              {content.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-[#CBD5E1]">
            <span className="px-3 py-1 rounded-full bg-[#07101F] border border-[#38BDF8]/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{content.activeOrbit}</span>
            </span>
          </div>
        </div>

        {/* Focus Item Grid: compact on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {itemList.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-xl border border-white/10 bg-[#050816]/75 hover:border-[#38BDF8]/30 hover:bg-[#07101F] transition-all duration-200 space-y-2.5 backdrop-blur-md flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getIcon(item.category)}
                    <span className="text-[11px] font-mono text-[#94A3B8] uppercase">
                      {item.category}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                    item.status === 'In Progress'
                      ? 'bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/20'
                      : item.status === 'Active Exploration'
                      ? 'bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <h4 className="font-display font-bold text-sm sm:text-base text-white">
                  {item.item}
                </h4>

                <p className="text-xs text-[#CBD5E1] leading-relaxed font-light">
                  {item.detail}
                </p>
              </div>

              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
                <span>FOCUS DOMAIN</span>
                <span className="text-[#38BDF8]">VERIFIED 2026</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
