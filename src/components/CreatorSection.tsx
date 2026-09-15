import React from 'react';
import { 
  Play, 
  Youtube, 
  Clock, 
  Sparkles, 
  ArrowUpRight 
} from 'lucide-react';
import { DbCreatorVideo, getDerivedYouTubeThumbnail } from '../services/creatorVideoService';
import { CREATOR_CONTENT } from '../data/siteContent';
import { FEATURED_VIDEO, ADDITIONAL_VIDEOS } from '../data/creatorContent';

export interface CreatorSectionProps {
  videos?: DbCreatorVideo[];
  featuredVideo?: DbCreatorVideo | null;
  archiveVideos?: DbCreatorVideo[];
}

export const CreatorSection: React.FC<CreatorSectionProps> = ({ 
  videos,
  featuredVideo: propFeatured,
  archiveVideos: propArchive
}) => {
  // Determine featured video:
  // 1. propFeatured if provided
  // 2. video with is_featured === true from videos array
  // 3. first video in videos array
  // 4. static fallback FEATURED_VIDEO
  let featured: {
    id: string;
    title: string;
    category: string;
    duration: string;
    summary: string;
    youtubeUrl: string;
    thumbnailUrl: string;
    videoId: string;
  };

  if (propFeatured) {
    featured = {
      id: propFeatured.id,
      title: propFeatured.title,
      category: propFeatured.category,
      duration: propFeatured.duration,
      summary: (propFeatured as any).summary || (propFeatured as any).description || propFeatured.title,
      youtubeUrl: propFeatured.youtube_url || 'https://youtube.com',
      thumbnailUrl: propFeatured.thumbnail_url || (propFeatured.video_id ? getDerivedYouTubeThumbnail(propFeatured.video_id) : ''),
      videoId: propFeatured.video_id || '',
    };
  } else if (videos && videos.length > 0) {
    const found = videos.find(v => v.is_featured) || videos[0];
    featured = {
      id: found.id,
      title: found.title,
      category: found.category,
      duration: found.duration,
      summary: (found as any).summary || (found as any).description || found.title,
      youtubeUrl: found.youtube_url || 'https://youtube.com',
      thumbnailUrl: found.thumbnail_url || (found.video_id ? getDerivedYouTubeThumbnail(found.video_id) : ''),
      videoId: found.video_id || '',
    };
  } else {
    featured = {
      id: FEATURED_VIDEO.id,
      title: FEATURED_VIDEO.title,
      category: FEATURED_VIDEO.category,
      duration: FEATURED_VIDEO.duration,
      summary: FEATURED_VIDEO.description,
      youtubeUrl: FEATURED_VIDEO.youtubeUrl,
      thumbnailUrl: FEATURED_VIDEO.thumbnail || '',
      videoId: '',
    };
  }

  // Determine archive videos (first 4 published archive videos):
  let archive: Array<{
    id: string;
    title: string;
    category: string;
    duration: string;
    youtubeUrl: string;
    thumbnailUrl: string;
    videoId: string;
    label: string;
  }>;

  if (propArchive && propArchive.length > 0) {
    archive = propArchive.slice(0, 4).map((v, i) => ({
      id: v.id,
      title: v.title,
      category: v.category,
      duration: v.duration,
      youtubeUrl: v.youtube_url || 'https://youtube.com',
      thumbnailUrl: v.thumbnail_url || (v.video_id ? getDerivedYouTubeThumbnail(v.video_id) : ''),
      videoId: v.video_id || '',
      label: `Release 0${i + 1}`
    }));
  } else if (videos && videos.length > 0) {
    const remaining = videos.filter(v => v.id !== featured.id).slice(0, 4);
    archive = (remaining.length > 0 ? remaining : videos.slice(1, 5)).map((v, i) => ({
      id: v.id,
      title: v.title,
      category: v.category,
      duration: v.duration,
      youtubeUrl: v.youtube_url || 'https://youtube.com',
      thumbnailUrl: v.thumbnail_url || (v.video_id ? getDerivedYouTubeThumbnail(v.video_id) : ''),
      videoId: v.video_id || '',
      label: `Release 0${i + 1}`
    }));
  } else {
    archive = ADDITIONAL_VIDEOS.slice(0, 4).map((v, i) => ({
      id: v.id,
      title: v.title,
      category: v.category,
      duration: v.duration,
      youtubeUrl: v.youtubeUrl || 'https://youtube.com',
      thumbnailUrl: v.thumbnail || '',
      videoId: '',
      label: `Release 0${i + 1}`
    }));
  }

  return (
    <section id="creator" className="relative w-full py-16 sm:py-24 md:py-32 px-4 sm:px-8 md:px-12 z-10">
      
      {/* Section Header — No filters, direct and clean */}
      <div className="max-w-6xl mx-auto mb-8 sm:mb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/10 pb-4 sm:pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#38BDF8] uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{CREATOR_CONTENT.badge}</span>
            </div>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold text-white tracking-tight">
              {CREATOR_CONTENT.title}
            </h2>
            <p className="text-base sm:text-lg font-display font-semibold text-[#38BDF8] mt-1 tracking-wide">
              {CREATOR_CONTENT.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-mono text-[#CBD5E1] hover:text-white px-3 py-1.5 rounded-full bg-[#07101F] border border-white/10 hover:border-[#38BDF8]/40 transition-colors"
            >
              <Youtube className="w-3.5 h-3.5 text-red-500" />
              <span>YOUTUBE CHANNEL</span>
              <ArrowUpRight className="w-3 h-3 text-[#94A3B8]" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
        
        {/* ========================================================================= */}
        {/* 1. MOBILE CREATOR PRESENTATION (< lg)                                     */}
        {/* ========================================================================= */}
        <div className="lg:hidden space-y-6">
          
          {/* Featured Video: Compact & Direct YouTube Link */}
          <div className="rounded-2xl border border-[#38BDF8]/30 bg-[#050816] overflow-hidden">
            <a 
              href={featured.youtubeUrl || 'https://youtube.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-video bg-[#03050B] flex items-center justify-center cursor-pointer group block"
            >
              <div 
                className="absolute inset-0 bg-gradient-to-tr from-[#050816] via-[#07101F] to-[#0B1120] opacity-95"
                style={{
                  backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.18) 0%, transparent 70%)'
                }}
              />

              {/* Center Play Button */}
              <div className="relative z-10 w-12 h-12 rounded-full bg-[#38BDF8] text-[#03050B] flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.5)] group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-current translate-x-0.5" />
              </div>

              {/* Tag & Duration */}
              <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-[#03050B]/85 font-mono text-[9px] text-[#38BDF8] uppercase font-semibold">
                FEATURED
              </div>
              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-[#03050B]/85 font-mono text-[10px] text-white flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#38BDF8]" />
                <span>{featured.duration}</span>
              </div>
            </a>

            {/* Video Meta */}
            <div className="p-4 space-y-2">
              <span className="text-[10px] font-mono text-[#38BDF8] uppercase tracking-wider block">
                {featured.category}
              </span>
              <h3 className="text-base font-display font-bold text-white leading-snug">
                {featured.title}
              </h3>
              <p className="text-xs text-[#CBD5E1] font-light line-clamp-2">
                {featured.summary}
              </p>

              <a
                href={featured.youtubeUrl || 'https://youtube.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] w-full mt-2 rounded-xl bg-[#38BDF8] hover:bg-[#60A5FA] text-[#03050B] font-mono text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <Play className="w-3.5 h-3.5 fill-[#03050B]" />
                <span>WATCH ON YOUTUBE</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* 4 Extra Archive Videos: Horizontal Swipe Strip */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
              <span>ADDITIONAL PRODUCTIONS ({archive.length})</span>
              <span className="text-[10px] text-[#38BDF8]">SWIPE →</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory -mx-4 px-4 scrollbar-none">
              {archive.map((video) => (
                <a
                  key={video.id}
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-60 shrink-0 snap-start rounded-xl border border-white/10 bg-[#050816] p-3 space-y-2.5 cursor-pointer active:scale-98 transition-transform block group hover:border-[#38BDF8]/40"
                >
                  {/* Compact Thumb */}
                  <div className="relative aspect-video rounded-lg bg-[#03050B] flex items-center justify-center border border-white/5 overflow-hidden">
                    {video.thumbnailUrl && (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="relative z-10 w-8 h-8 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8]/40 text-[#38BDF8] flex items-center justify-center group-hover:bg-[#38BDF8] group-hover:text-[#03050B] transition-colors">
                      <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                    </div>
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-[#03050B]/90 font-mono text-[9px] text-white z-10">
                      {video.duration}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-[#38BDF8] uppercase block">
                      {video.category}
                    </span>
                    <h4 className="font-display font-semibold text-xs text-white line-clamp-2 leading-snug group-hover:text-[#38BDF8] transition-colors">
                      {video.title}
                    </h4>
                  </div>

                  <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
                    <span>{video.label}</span>
                    <ArrowUpRight className="w-3 h-3 text-[#38BDF8]" />
                  </div>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* 2. DESKTOP CREATOR PRESENTATION (lg+)                                     */}
        {/* ========================================================================= */}
        <div className="hidden lg:block space-y-12">
          
          {/* Dominant Featured Video Showcase */}
          <div className="relative rounded-2xl border border-[#38BDF8]/20 bg-[#050816] overflow-hidden group shadow-[0_0_50px_rgba(56,189,248,0.08)]">
            <div className="grid grid-cols-12 gap-0 relative z-10">
              
              {/* Left Preview Screen / Direct YouTube Link (7 cols) */}
              <a 
                href={featured.youtubeUrl || 'https://youtube.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-7 relative aspect-video bg-[#03050B] flex items-center justify-center overflow-hidden cursor-pointer border-r border-white/10 group block"
              >
                <div 
                  className="absolute inset-0 bg-gradient-to-tr from-[#050816] via-[#07101F] to-[#0B1120] opacity-90 transition-transform duration-700 group-hover:scale-105"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(56, 189, 248, 0.15) 0%, transparent 60%)'
                  }}
                />

                <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 400 225">
                  <path d="M 50 112 H 180 L 220 70 H 350" stroke="#38BDF8" strokeWidth="1.5" fill="none" strokeDasharray="6 4" />
                  <circle cx="180" cy="112" r="3" fill="#38BDF8" />
                  <circle cx="220" cy="70" r="3" fill="#60A5FA" />
                </svg>

                {/* Center Play Button Orb */}
                <div className="relative z-20 flex flex-col items-center gap-3">
                  <div className="w-20 h-20 rounded-full bg-[#38BDF8]/20 border border-[#38BDF8] flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_35px_rgba(56,189,248,0.6)] backdrop-blur-md">
                    <Play className="w-8 h-8 text-white fill-white translate-x-0.5" />
                  </div>
                  <span className="font-mono text-xs text-[#CBD5E1] tracking-widest uppercase bg-[#03050B]/80 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                    <span>WATCH ON YOUTUBE</span>
                    <ArrowUpRight className="w-3 h-3 text-[#38BDF8]" />
                  </span>
                </div>

                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#03050B]/85 border border-[#38BDF8]/40 font-mono text-[10px] text-[#38BDF8] uppercase tracking-wider">
                    FEATURED PRODUCTION
                  </span>
                </div>

                <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#03050B]/85 border border-white/10 font-mono text-xs text-white">
                  <Clock className="w-3 h-3 text-[#38BDF8]" />
                  <span>{featured.duration}</span>
                </div>
              </a>

              {/* Right Meta & Storyline (5 cols) */}
              <div className="col-span-5 p-8 flex flex-col justify-between bg-[#050816]/90 backdrop-blur-md">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#38BDF8] uppercase tracking-wider">
                      {featured.category}
                    </span>
                    <span className="font-mono text-xs text-[#94A3B8]">
                      Flagship
                    </span>
                  </div>

                  <h3 className="text-2xl font-display font-bold text-white leading-snug">
                    {featured.title}
                  </h3>

                  <p className="text-sm text-[#CBD5E1] leading-relaxed">
                    {featured.summary}
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-[#07101F] text-[#94A3B8] border border-white/5">
                      #{featured.category}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-[#07101F] text-[#94A3B8] border border-white/5">
                      #YouTubeProduction
                    </span>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                  <a
                    href={featured.youtubeUrl || 'https://youtube.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-[#38BDF8] hover:bg-[#60A5FA] text-[#03050B] font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.25)]"
                  >
                    <Play className="w-3.5 h-3.5 fill-[#03050B]" />
                    <span>WATCH ON YOUTUBE</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8]">
                    <Youtube className="w-4 h-4 text-red-500" />
                    <span>4K UHD</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Media Rail of Exactly 4 Additional Video Releases */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono tracking-widest text-[#94A3B8] uppercase">
                ARCHIVE & FUTURE PRODUCTIONS ({archive.length})
              </span>
              <span className="text-xs font-mono text-[#38BDF8]">
                DIRECT YOUTUBE LINKS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {archive.map((video) => (
                <a
                  key={video.id}
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-xl border border-white/10 bg-[#050816]/70 hover:border-[#38BDF8]/40 hover:bg-[#07101F] transition-all duration-300 p-4 flex flex-col justify-between cursor-pointer space-y-3 backdrop-blur-sm block"
                >
                  <div className="relative aspect-video rounded-lg bg-[#03050B] border border-white/5 overflow-hidden flex items-center justify-center">
                    {video.thumbnailUrl && (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="relative z-10 w-10 h-10 rounded-full bg-white/10 group-hover:bg-[#38BDF8] group-hover:text-[#03050B] text-white flex items-center justify-center transition-all duration-300">
                      <Play className="w-4 h-4 translate-x-0.5 fill-current" />
                    </div>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-[#03050B]/90 font-mono text-[10px] text-white z-10">
                      {video.duration}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-[#38BDF8]">
                      {video.category}
                    </span>
                    <h4 className="font-display font-semibold text-sm text-white line-clamp-2 group-hover:text-[#38BDF8] transition-colors">
                      {video.title}
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                    <span>{video.label}</span>
                    <span className="text-[#38BDF8] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      WATCH <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>

        </div>

      </div>

    </section>
  );
};
