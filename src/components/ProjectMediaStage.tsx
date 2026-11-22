import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  ArrowUpRight,
  Loader2,
  Layers
} from 'lucide-react';
import { ProjectItem, ProjectMedia } from '../types';
import { fetchPublishedProjectMedia } from '../services/projectMediaService';

interface ProjectMediaStageProps {
  project: ProjectItem;
  mediaList?: ProjectMedia[];
  variant?: 'default' | 'desktop-compact';
}

export const ProjectMediaStage: React.FC<ProjectMediaStageProps> = ({ 
  project,
  mediaList: initialMediaList,
  variant = 'default'
}) => {
  const isDesktopCompact = variant === 'desktop-compact';
  const [mediaItems, setMediaItems] = useState<ProjectMedia[]>(initialMediaList || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialMediaList);
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [mediaDirection, setMediaDirection] = useState<number>(1);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [isMediaLoaded, setIsMediaLoaded] = useState<boolean>(false);
  const [mediaLoadError, setMediaLoadError] = useState<boolean>(false);

  const touchStartXRef = useRef<number | null>(null);

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

  useEffect(() => {
    setIsMediaLoaded(false);
    setMediaLoadError(false);

    if (!currentMedia || currentMedia.mediaType !== 'image') {
      return;
    }

    let isCancelled = false;

    const img = new Image();
    img.src = currentMedia.mediaUrl;

    if (img.complete) {
      if (img.naturalWidth > 0 || img.naturalHeight > 0) {
        setIsMediaLoaded(true);
      } else {
        setIsMediaLoaded(true);
        setMediaLoadError(true);
      }
    } else {
      img.onload = () => {
        if (!isCancelled) {
          setIsMediaLoaded(true);
          setMediaLoadError(false);
        }
      };
      img.onerror = () => {
        if (!isCancelled) {
          setIsMediaLoaded(true);
          setMediaLoadError(true);
        }
      };
    }

    return () => {
      isCancelled = true;
    };
  }, [activeMediaIndex, currentMedia?.id, currentMedia?.mediaUrl, currentMedia?.mediaType]);

  const handlePrevMedia = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (totalMedia <= 1) return;
    setMediaDirection(-1);
    setActiveMediaIndex((prev) => (prev > 0 ? prev - 1 : totalMedia - 1));
  }, [totalMedia]);

  const handleNextMedia = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (totalMedia <= 1) return;
    setMediaDirection(1);
    setActiveMediaIndex((prev) => (prev < totalMedia - 1 ? prev + 1 : 0));
  }, [totalMedia]);

  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

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
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen, handlePrevMedia, handleNextMedia]);

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
    <div className={isDesktopCompact ? 'w-full h-full' : 'w-full'}>
      <div 
        id={`project-media-stage-${project.id}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={
          isDesktopCompact
            ? 'group relative w-full work-desktop-gallery rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden transition-all duration-300 hover:border-[var(--border-strong)]'
            : 'group relative w-full h-[260px] sm:h-[320px] md:h-[360px] lg:h-[380px] rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] backdrop-blur-xl overflow-hidden shadow-[var(--shadow-card)] transition-all duration-300 hover:border-[var(--border-strong)]'
        }
      >
        {/* Ambient Subtle Glow Layer */}
        <div className="absolute inset-0 bg-radial from-[#111111]/[0.03] dark:from-[#F5F5F5]/[0.04] via-transparent to-transparent pointer-events-none" />

        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-surface)]/85 z-20">
            <Loader2 className="w-6 h-6 text-[var(--text-primary)] animate-spin mb-2" />
            <span className="font-mono text-xs text-[var(--text-secondary)] tracking-widest uppercase">
              CALIBRATING MEDIA STAGE...
            </span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && totalMedia === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="relative mb-3.5">
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] shadow-inner">
                <Layers className="w-6 h-6" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--text-primary)] animate-pulse" />
            </div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)] mb-1 font-semibold">
              PROJECT MEDIA
            </h4>
            <p className="text-[var(--text-primary)] font-medium text-sm sm:text-base mb-1">
              No media added yet
            </p>
            <p className="text-xs font-mono text-[var(--text-secondary)] max-w-sm">
              Visual records and media assets will be published from the command center.
            </p>
          </div>
        )}

        {/* Active Media Presenter */}
        {!isLoading && totalMedia > 0 && currentMedia && (
          <>
            {/* Ambient Blurred Backdrop */}
            {currentMedia.mediaType === 'image' && (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-15 blur-2xl scale-110 pointer-events-none transition-all duration-700"
                style={{ backgroundImage: `url(${currentMedia.mediaUrl})` }}
              />
            )}

            {/* Media Content */}
            <div 
              onClick={() => setIsLightboxOpen(true)}
              className={
                isDesktopCompact
                  ? 'absolute inset-0 flex items-center justify-center cursor-pointer select-none'
                  : 'relative w-full h-full flex items-center justify-center cursor-pointer select-none'
              }
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
                  className={
                    isDesktopCompact
                      ? 'w-full h-full flex items-center justify-center pt-11 pb-12 px-4'
                      : 'w-full h-full flex items-center justify-center p-3 sm:p-5'
                  }
                >
                  {currentMedia.mediaType === 'image' ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {!isMediaLoaded && !mediaLoadError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-[var(--text-primary)] animate-spin" />
                        </div>
                      )}
                      {mediaLoadError ? (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <ImageIcon className="w-8 h-8 text-[var(--text-muted)] mb-2" />
                          <span className="font-mono text-xs text-[var(--text-secondary)]">Unable to load image asset</span>
                        </div>
                      ) : (
                        <img
                          key={`${currentMedia.id}-${currentMedia.mediaUrl}`}
                          src={currentMedia.mediaUrl}
                          alt={currentMedia.altText || currentMedia.caption || project.title}
                          onLoad={() => {
                            setIsMediaLoaded(true);
                            setMediaLoadError(false);
                          }}
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
                      <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-[var(--bg-surface-blur)] backdrop-blur-md border border-[var(--border-subtle)] text-[var(--text-primary)] pointer-events-none">
                        <VideoIcon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Top Bar Overlay */}
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2 pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface-blur)] backdrop-blur-md border border-[var(--border-subtle)] text-[10px] font-mono font-medium text-[var(--text-primary)] tracking-wider uppercase">
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
                  <span className="hidden sm:inline-block max-w-[320px] truncate px-2.5 py-1 rounded-lg bg-[var(--bg-surface-blur)] backdrop-blur-md border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)]">
                    {currentMedia.caption}
                  </span>
                )}
              </div>

              {/* Bottom Bar */}
              <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20 flex items-center justify-between pointer-events-none">
                {/* Counter */}
                <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[var(--bg-surface-blur)] backdrop-blur-md border border-[var(--border-subtle)] pointer-events-auto">
                  <span className="font-mono text-xs font-semibold text-[var(--text-primary)] tracking-widest">
                    {String(activeMediaIndex + 1).padStart(2, '0')}{' '}
                    <span className="text-[var(--text-secondary)] font-normal">/ {String(totalMedia).padStart(2, '0')}</span>
                  </span>

                  {totalMedia > 1 && (
                    <div className="flex items-center gap-1 pl-2 border-l border-[var(--border-subtle)]">
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
                              ? 'w-4 bg-[var(--text-primary)]' 
                              : 'w-1.5 bg-[var(--text-muted)]/50 hover:bg-[var(--text-secondary)]'
                          }`}
                          aria-label={`Jump to media ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* VIEW Action Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface-blur)] hover:bg-[var(--bg-elevated)] active:scale-95 backdrop-blur-md border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono font-medium text-[var(--text-primary)] transition-all cursor-pointer pointer-events-auto shadow-md"
                  aria-label="View media in fullscreen lightbox"
                >
                  <span>VIEW</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                </button>
              </div>

              {/* Prev / Next Navigation Arrows */}
              {totalMedia > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevMedia}
                    aria-label="Previous project media"
                    className={`absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 z-20 min-w-[40px] min-h-[40px] p-2 rounded-full bg-[var(--bg-surface-blur)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all focus:opacity-100 cursor-pointer backdrop-blur-md shadow-lg active:scale-90 flex items-center justify-center ${
                      isDesktopCompact
                        ? 'opacity-75 group-hover:opacity-100'
                        : 'opacity-85 sm:opacity-0 sm:group-hover:opacity-100'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextMedia}
                    aria-label="Next project media"
                    className={`absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 z-20 min-w-[40px] min-h-[40px] p-2 rounded-full bg-[var(--bg-surface-blur)] hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all focus:opacity-100 cursor-pointer backdrop-blur-md shadow-lg active:scale-90 flex items-center justify-center ${
                      isDesktopCompact
                        ? 'opacity-75 group-hover:opacity-100'
                        : 'opacity-85 sm:opacity-0 sm:group-hover:opacity-100'
                    }`}
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
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isLightboxOpen && currentMedia && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setIsLightboxOpen(false)}
                className="fixed inset-0 z-[70] h-[100dvh] w-screen overflow-hidden flex flex-col bg-[var(--bg-canvas)]/96 backdrop-blur-2xl px-3 py-3 sm:px-6 sm:py-4"
                role="dialog"
                aria-modal="true"
                aria-label={`${project.title} expanded media viewer`}
              >
                {/* Top Bar */}
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 w-full flex items-center justify-between gap-3 py-1 z-20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs sm:text-sm font-semibold text-[var(--text-primary)] tracking-widest bg-[var(--bg-surface)] px-3 py-1 rounded-full border border-[var(--border-subtle)] tabular-nums shrink-0">
                      {activeMediaIndex + 1}/{totalMedia}
                    </span>
                    <span className="hidden sm:inline-block text-xs font-mono text-[var(--text-secondary)] truncate">
                      {project.title}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(false)}
                    className="min-w-[42px] min-h-[42px] rounded-full bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center cursor-pointer active:scale-95 transition-all shrink-0"
                    aria-label="Close fullscreen lightbox"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Main Media Display */}
                <div className="relative flex-1 min-h-0 min-w-0 w-full my-2 sm:my-3">
                  <div className="absolute inset-y-0 inset-x-12 sm:inset-x-16 flex items-center justify-center">
                    {currentMedia.mediaType === 'image' ? (
                      <img
                        src={currentMedia.mediaUrl}
                        alt={currentMedia.altText || currentMedia.caption || project.title}
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl select-none"
                      />
                    ) : (
                      <video
                        src={currentMedia.mediaUrl}
                        controls
                        autoPlay
                        onClick={(e) => e.stopPropagation()}
                        className="max-w-full max-h-full w-auto h-auto object-contain rounded-xl shadow-2xl"
                      />
                    )}
                  </div>

                  {totalMedia > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrevMedia}
                        aria-label="Previous item"
                        className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 z-20 min-w-[42px] min-h-[42px] rounded-full bg-[var(--bg-surface-blur)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] flex items-center justify-center cursor-pointer backdrop-blur-md active:scale-95 transition-all"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <button
                        type="button"
                        onClick={handleNextMedia}
                        aria-label="Next item"
                        className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 z-20 min-w-[42px] min-h-[42px] rounded-full bg-[var(--bg-surface-blur)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] flex items-center justify-center cursor-pointer backdrop-blur-md active:scale-95 transition-all"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Bottom Chrome */}
                {(totalMedia > 1 || currentMedia.caption) && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 w-full flex flex-col items-center gap-1.5 pt-1 z-20"
                  >
                    {totalMedia > 1 && (
                      <div className="w-full flex items-center justify-center gap-2 py-1 overflow-x-auto no-scrollbar">
                        {mediaItems.map((item, idx) => (
                          <button
                            key={item.id || idx}
                            type="button"
                            onClick={() => {
                              setMediaDirection(idx > activeMediaIndex ? 1 : -1);
                              setActiveMediaIndex(idx);
                            }}
                            className={`relative w-11 h-11 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                              idx === activeMediaIndex
                                ? 'border-[var(--text-primary)] shadow-md scale-105'
                                : 'border-[var(--border-subtle)] opacity-50 hover:opacity-80'
                            }`}
                          >
                            {item.mediaType === 'image' ? (
                              <img
                                src={item.mediaUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-primary)]">
                                <VideoIcon className="w-4 h-4" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {currentMedia.caption && (
                      <div className="w-full text-center px-4">
                        <p className="text-xs font-mono text-[var(--text-secondary)] truncate max-w-2xl mx-auto">
                          {currentMedia.caption}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
};
