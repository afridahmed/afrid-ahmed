import React from 'react';
import { 
  User, 
  GraduationCap, 
  ShieldCheck,
  Code2,
  Cpu,
  Compass
} from 'lucide-react';
import { ABOUT_CONTENT } from '../data/siteContent';
import { AboutContent } from '../types';

interface AboutSectionProps {
  content?: AboutContent;
}

export const AboutSection: React.FC<AboutSectionProps> = ({
  content = ABOUT_CONTENT
}) => {
  return (
    <section id="about" className="relative w-full py-16 sm:py-24 md:py-32 px-4 sm:px-8 md:px-12 z-10">
      
      {/* Section Header */}
      <div className="max-w-6xl mx-auto mb-8 sm:mb-12">
        <div className="border-b border-white/10 pb-4 sm:pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#38BDF8] uppercase mb-1">
              <User className="w-3.5 h-3.5" />
              <span>{content.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold text-white tracking-tight">
              {content.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#CBD5E1]">
            <GraduationCap className="w-4 h-4 text-[#38BDF8]" />
            <span>{content.graduationTag}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        
        {/* Main 2-Column Balanced Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Editorial Portrait + Anchored Details (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start space-y-5">
            
            {/* Portrait Frame */}
            <div className="relative w-full max-w-[320px] sm:max-w-sm aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-[#050816] shadow-[0_10px_35px_rgba(0,0,0,0.6)] group mx-auto lg:mx-0">
              
              {/* Soft background blue tint */}
              <div className="absolute -top-10 -right-10 w-36 h-36 bg-[#38BDF8]/10 rounded-full blur-2xl pointer-events-none" />

              {/* Portrait Image */}
              <div className="relative w-full h-full">
                <img
                  src={content.photo}
                  alt={content.photoCaption.name}
                  className="w-full h-full object-cover object-center filter contrast-[1.02] brightness-95 transition-transform duration-700 group-hover:scale-102"
                  referrerPolicy="no-referrer"
                />

                {/* Dark edge blending vignette */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: 'inset 0 0 40px 12px #050816, inset 0 -60px 40px #03050B'
                  }}
                />
              </div>

              {/* Editorial bottom caption tag */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 p-3 rounded-xl bg-[#03050B]/85 backdrop-blur-md border border-white/10 flex items-center justify-between z-10">
                <div className="flex flex-col">
                  <span className="font-display font-bold text-xs text-white">
                    {content.photoCaption.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#38BDF8]">
                    {content.photoCaption.role}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#94A3B8]">
                  {content.photoCaption.classYear}
                </span>
              </div>
            </div>

            {/* Authenticity Verification Tag */}
            <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] w-full max-w-[320px] sm:max-w-sm justify-center lg:justify-start">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{content.photoCaption.verifiedText}</span>
            </div>

            {/* Anchored Orientation Highlights */}
            <div className="w-full max-w-[320px] sm:max-w-sm space-y-2 pt-1">
              <div className="p-3 rounded-xl bg-[#050816] border border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#94A3B8] uppercase">ACADEMIC FOUNDATION</div>
                  <div className="text-xs font-display font-bold text-white">Computer Science</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#050816] border border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#60A5FA]/10 text-[#60A5FA] flex items-center justify-center shrink-0">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#94A3B8] uppercase">CORE EXPLORATION</div>
                  <div className="text-xs font-display font-bold text-white">AI/ML & Systems Engineering</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#050816] border border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#94A3B8] uppercase">TRAJECTORY HORIZON</div>
                  <div className="text-xs font-display font-bold text-white">Class of 2030</div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Authentic Biography & Technical Toolsets (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Supporting Statement */}
            <div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-display font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-[#CBD5E1] to-[#38BDF8] leading-tight">
                {content.statement}
              </h3>
            </div>

            {/* Concise Personal Copy */}
            <div className="space-y-3.5 text-sm sm:text-base text-[#CBD5E1] leading-relaxed font-light">
              {content.biography.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            {/* Core Orientation Quote Callout */}
            <div className="p-4 sm:p-5 rounded-xl border border-[#38BDF8]/20 bg-[#07101F]/60 backdrop-blur-md space-y-1.5">
              <span className="text-[10px] sm:text-[11px] font-mono text-[#38BDF8] uppercase tracking-wider block font-semibold">
                CORE ORIENTATION
              </span>
              <p className="text-xs sm:text-sm font-mono text-white italic">
                "{content.quote}"
              </p>
            </div>

            {/* Technical Toolset Matrix */}
            <div className="space-y-2.5 pt-2">
              <div className="text-xs font-mono tracking-wider text-[#94A3B8] uppercase">
                TECHNICAL PROFICIENCIES & EXPLORATIONS
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {content.techStack.map((group) => (
                  <div
                    key={group.category}
                    className="p-3.5 rounded-xl bg-[#050816] border border-white/5 space-y-1.5"
                  >
                    <div className="text-xs font-mono font-semibold text-[#38BDF8]">
                      {group.category}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item) => (
                        <span
                          key={item}
                          className="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono bg-[#07101F] text-[#CBD5E1] border border-white/5"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
};
