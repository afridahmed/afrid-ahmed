import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Play, 
  X, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  ArrowUpRight,
  Loader2,
  Sparkles,
  Layers
} from 'lucide-react';
import { ProjectItem, ProjectMedia } from '../types';
import { fetchPublishedProjectMedia } from '../services/projectMediaService';

interface ProjectMediaStageProps {
  project: ProjectItem;
  mediaList?: ProjectMedia[];
}

export const ProjectMediaStage: React.FC<ProjectMediaStageProps> = ({ 
  project,
  mediaList: initialMediaList
}) => {
  const [mediaItems, setMediaItems] = useState<ProjectMedia[]>(initialMediaList || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialMediaList);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [mediaDirection, setMediaDirection] = useState<number>(1);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [isMediaLoaded, setIsMediaLoaded] = useState<boolean>(false);
  const [mediaLoadError, setMediaLoadError] = useState<boolean>(false);

  // Touch swipe support for mobile
  const touchStartXRef = useRef<number | null>(null);

  // Load project media whenever active project changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setIsMediaLoaded(false);
    setMediaLoadError(false);
    setActiveMediaIndex(0);

    const loadMedia = async () => {
      try {
        const items = await fetchPublishedProjectMedia(project.id);
        if (isMounted) {
          setMediaItems(items);
          // Find primary/featured item if exists
          const primaryIdx = items.findIndex((m) => m.isFeatured);
          if (primaryIdx > 0) {
            setActiveMediaIndex(primaryIdx);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMedia();

    return () => {
      isMounted = false;
    };
  }, [project.id]);

  const currentMedia: ProjectMedia | undefined = mediaItems[activeMediaIndex];
  const totalMedia = mediaItems.length;

  // Reset media loaded state when active media changes
  useEffect(() => {
    setIsMediaLoaded(false);
    setMediaLoadError(false);
  }, [activeMediaIndex, currentMedia?.mediaUrl]);

  // Navigate to previous media
  const handlePrevMedia = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (totalMedia <= 1) return;
    setMediaDirection(-1);
    setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : totalMedia - 1));
  }, [totalMedia]);

  // Navigate to next media
  const handleNextMedia = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (totalMedia <= 1) return;
    setMediaDirection(1);
    setActiveMediaIndex((prev) => (prev < totalMedia - 1 ? prev + 1 : 0));
  }, [totalMedia]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowLeft') {
        handlePrevMedia();
      } else if (e.key === 'ArrowRight') {
        handleNextMedia();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handlePrevMedia, handleNextMedia]);

  // Mobile Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartXRef.current - touchEndX;

    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNextMedia();
      } else {
        handlePrevMedia();
      }
    }
    touchStartXRef.current = null;
  };

  return (
    <div className="w-full">
      {/* ===================================================================== */}
      {/* 1. FIXED-FOOTPRINT MEDIA STAGE CONTAINER                              */}
      {/* Stable cinematic proportions: 16:7 on desktop, 16:9 on mobile          */}
      {/* No vertical shift or height oscillation between projects or items    */}
      {/* ===================================================================== */}
      <div 
        id={`project-media-stage-${project.id}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="group relative w-full h-[260px] sm:h-[320px] md:h-[360px] lg:h-[380px] rounded-2xl border border-white/10 bg-[#050816]/95 backdrop-blur-xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-[#38BDF8]/30"
      >
        {/* Ambient Subtle Glow Layer */}
        <div className="absolute inset-0 bg-radial from-[#38BDF8]/5 via-transparent to-transparent pointer-events-none" />

        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#07101F]/80 z-20">
            <Loader2 className="w-6 h-6 text-[#38BDF8] animate-spin mb-2" />
            <span className="font-mono text-xs text-[#94A3B8] tracking-widest uppercase">
              CALIBRATING MEDIA STAGE...
            </span>
          </div>
        )}

        {/* Empty State: No media published yet for this project */}
        {!isLoading && totalMedia === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="relative mb-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[#0B1528] border border-white/10 flex items-center justify-center text-[#38BDF8]/60 shadow-inner">
                <Layers className="w-6 h-6" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-pulse" />
            </div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-[#38BDF8] mb-1 font-semibold">
              PROJECT MEDIA
            </h4>
            <p className="text-white font-medium text-sm sm:text-base mb-1">
              No media added yet
            </p>
            <p className="text-xs font-mono text-[#94A3B8] max-w-sm">
              Visual records and media assets will be published from the command center.
            </p>
          </div>
        )}

        {/* Active Media Presenter */}
        {!isLoading && totalMedia > 0 && currentMedia && (
          <>
            {/* Ambient Blurred Backdrop for Cinematic Fill */}
            {currentMedia.mediaType === 'image' && (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-20 blur-2xl scale-110 pointer-events-none transition-all duration-700"
                style={{ backgroundImage: `url(${currentMedia.mediaUrl})` }}
              />
            )}

            {/* Media Content with directional smooth GPU transition */}
            <div 
              onClick={() => setIsLightboxOpen(true)}
              className="relative w-full h-full flex items-center justify-center cursor-pointer select-none"
            >
              <AnimatePresence mode="wait" custom={mediaDirection}>
                <motion.div
                  key={`${currentMedia.id}-${activeMediaIndex}`}
                  custom={mediaDirection}
                  variants={{
                    enter: (dir: number) => ({
                      opacity: 0,
                      x: dir > 0 ? 30 : -30,
                    }),
                    center: {
                      opacity: 1,
                      x: 0,
                      transition: {
                        x: { type: 'spring', stiffness: 350, damping: 30 },
                        opacity: { duration: 0.25 },
                      },
                    },
                    exit: (dir: number) => ({
                      opacity: 0,
                      x: dir > 0 ? -30 : 30,
                      transition: { duration: 0.2 },
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="w-full h-full flex items-center justify-center p-3 sm:p-5"
                >
                  {/* Image Display */}
                  {currentMedia.mediaType === 'image' ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {!isMediaLoaded && !mediaLoadError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-[#38BDF8] animate-spin" />
                        </div>
                      )}
                      {mediaLoadError ? (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <ImageIcon className="w-8 h-8 text-[#94A3B8]/40 mb-2" />
                          <span className="font-mono text-xs text-[#94A3B8]">Unable to load image asset</span>
                        </div>
                      ) : (
                        <img
                          src={currentMedia.mediaUrl}
                          alt={currentMedia.altText || currentMedia.caption || project.title}
                          onLoad={() => setIsMediaLoaded(true)}
                          onError={() => {
                            setIsMediaLoaded(true);
                            setMediaLoadError(true);
                          }}
                          className={`max-w-full max-h-full object-contain rounded-xl shadow-lg transition-opacity duration-300 ${
                            isMediaLoaded ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      )}
                    </div>
                  ) : (
                    /* Video Display (Autoplay muted loop on stage) */
                    <div className="relative w-full h-full flex items-center justify-center">
                      <video
                        src={currentMedia.mediaUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        onLoadedData={() => setIsMediaLoaded(true)}
                        onError={() => {
                          setIsMediaLoaded(true);
                          setMediaLoadError(true);
                        }}
                        className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                      />
                      <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white/80 pointer-events-none">
                        <VideoIcon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Top Bar Overlay: Media Type / Caption */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#07101F]/80 backdrop-blur-md border border-white/10 text-[10px] font-mono font-medium text-[#38BDF8] tracking-wider uppercase">
                  {currentMedia.mediaType === 'video' ? (
                    <>
                      <VideoIcon className="w-3 h-3" />
                      VIDEO
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3 h-3" />
                      IMAGE
                    </>
                  )}
                </span>
                {currentMedia.caption && (
                  <span className="hidden sm:inline-block max-w-[320px] truncate px-2.5 py-1 rounded-lg bg-[#07101F]/80 backdrop-blur-md border border-white/10 text-[11px] font-mono text-[#CBD5E1]">
                    {currentMedia.caption}
                  </span>
                )}
              </div>

              {/* Bottom Bar: Counter (01 / 03) & VIEW ↗ Button */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20 flex items-center justify-between pointer-events-none">
                {/* 01 / 03 Counter */}
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#07101F]/85 backdrop-blur-md border border-white/10 pointer-events-auto">
                  <span className="font-mono text-xs font-semibold text-white tracking-widest">
                    {String(activeMediaIndex + 1).padStart(2, '0')}{' '}
                    <span className="text-[#94A3B8] font-normal">/ {String(totalMedia).padStart(2, '0')}</span>
                  </span>

                  {/* Thumbnail / Indicator Dots if > 1 */}
                  {totalMedia > 1 && (
                    <div className="flex items-center gap-1 pl-2 border-l border-white/10">
                      {mediaItems.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMediaDirection(idx > activeMediaIndex ? 1 : -1);
                            setActiveMediaIndex(idx);
                          }}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            idx === activeMediaIndex 
                              ? 'w-4 bg-[#38BDF8]' 
                              : 'w-1.5 bg-white/20 hover:bg-white/40'
                          }`}
                          aria-label={`Jump to media ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* VIEW ↗ Action Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#07101F]/85 hover:bg-[#0B1528] active:scale-95 backdrop-blur-md border border-white/10 hover:border-[#38BDF8]/40 text-xs font-mono font-medium text-white transition-all cursor-pointer pointer-events-auto shadow-md"
                  aria-label="View media in fullscreen lightbox"
                >
                  <span>VIEW</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#38BDF8]" />
                </button>
              </div>

              {/* Prev / Next Navigation Arrows (Appear on hover & touch friendly) */}
              {totalMedia > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevMedia}
                    aria-label="Previous project media"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-[#07101F]/80 hover:bg-[#0B1528] text-white/70 hover:text-white border border-white/10 hover:border-[#38BDF8]/40 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer backdrop-blur-md shadow-lg active:scale-90"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextMedia}
                    aria-label="Next project media"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-[#07101F]/80 hover:bg-[#0B1528] text-white/70 hover:text-white border border-white/10 hover:border-[#38BDF8]/40 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer backdrop-blur-md shadow-lg active:scale-90"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. FULLSCREEN LIGHTBOX / MEDIA VIEWER                                 */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {isLightboxOpen && currentMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl">
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border border-white/10 bg-[#07101F]/90 overflow-hidden shadow-2xl"
            >
              {/* Lightbox Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-[#0B1120]/80">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold text-[#38BDF8] tracking-wider uppercase">
                    {project.title}
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="font-mono text-xs text-[#94A3B8] tracking-widest">
                    {String(activeMediaIndex + 1).padStart(2, '0')} / {String(totalMedia).padStart(2, '0')}
                  </span>
                  {currentMedia.caption && (
                    <>
                      <span className="text-white/20 hidden sm:inline">•</span>
                      <span className="text-xs font-mono text-[#CBD5E1] truncate hidden sm:inline">
                        {currentMedia.caption}
                      </span>
                    </>
                  )}
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                  aria-label="Close fullscreen lightbox"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lightbox Main Media Body */}
              <div className="relative flex-1 min-h-[300px] max-h-[75vh] p-4 sm:p-8 flex items-center justify-center overflow-hidden">
                {currentMedia.mediaType === 'image' ? (
                  <img
                    src={currentMedia.mediaUrl}
                    alt={currentMedia.altText || currentMedia.caption || project.title}
                    className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl"
                  />
                ) : (
                  <video
                    src={currentMedia.mediaUrl}
                    controls
                    autoPlay
                    className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl"
                  />
                )}

                {/* Lightbox Left/Right Navigation */}
                {totalMedia > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevMedia}
                      aria-label="Previous item"
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#0B1528]/80 hover:bg-[#0F1E38] text-white border border-white/10 hover:border-[#38BDF8]/40 transition-all cursor-pointer backdrop-blur-md shadow-xl active:scale-95"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMedia}
                      aria-label="Next item"
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[#0B1528]/80 hover:bg-[#0F1E38] text-white border border-white/10 hover:border-[#38BDF8]/40 transition-all cursor-pointer backdrop-blur-md shadow-xl active:scale-95"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Lightbox Footer Caption on mobile */}
              {currentMedia.caption && (
                <div className="px-4 py-2.5 sm:hidden border-t border-white/10 bg-[#0B1120]/80">
                  <p className="text-xs font-mono text-[#CBD5E1] truncate">
                    {currentMedia.caption}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
