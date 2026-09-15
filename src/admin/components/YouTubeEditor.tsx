import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Star, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Youtube, 
  ExternalLink, 
  Clock, 
  Play, 
  RefreshCw,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';
import { 
  DbCreatorVideo, 
  DbCreatorVideoInsert,
  getAdminCreatorVideos, 
  createAdminCreatorVideo, 
  updateAdminCreatorVideo, 
  deleteAdminCreatorVideo, 
  togglePublishAdminCreatorVideo, 
  setFeaturedAdminCreatorVideo, 
  removeFeaturedAdminCreatorVideo,
  reorderAdminCreatorVideos,
  seedDefaultCreatorVideosIfEmpty,
  extractYouTubeVideoId,
  getDerivedYouTubeThumbnail,
  getCanonicalYouTubeWatchUrl
} from '../../services/creatorVideoService';

export const YouTubeEditor: React.FC = () => {
  const [videos, setVideos] = useState<DbCreatorVideo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVideo, setEditingVideo] = useState<DbCreatorVideo | null>(null);

  // Form fields
  const [formYoutubeUrl, setFormYoutubeUrl] = useState<string>('');
  const [formVideoId, setFormVideoId] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formDuration, setFormDuration] = useState<string>('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState<string>('');
  const [formIsFeatured, setFormIsFeatured] = useState<boolean>(false);
  const [formIsPublished, setFormIsPublished] = useState<boolean>(true);
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);

  // Auto-extraction flag
  const [videoIdManuallyEdited, setVideoIdManuallyEdited] = useState<boolean>(false);

  // Delete modal state
  const [deleteCandidate, setDeleteCandidate] = useState<DbCreatorVideo | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      // 1. Seed if empty
      await seedDefaultCreatorVideosIfEmpty();

      // 2. Fetch all videos
      const { data, error } = await getAdminCreatorVideos();
      if (error) {
        setStatusMessage({ type: 'error', text: `Failed to load videos: ${error}` });
      } else {
        setVideos(data);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error loading creator videos' });
    } finally {
      setIsLoading(false);
    }
  };

  // Open modal to add a new video
  const handleOpenAdd = () => {
    const nextOrder = videos.length > 0 ? Math.max(...videos.map(v => v.display_order || 0)) + 1 : 1;

    setEditingVideo(null);
    setFormYoutubeUrl('');
    setFormVideoId('');
    setFormTitle('');
    setFormCategory('Edge AI & Systems');
    setFormDuration('12:00');
    setFormThumbnailUrl('');
    setFormIsFeatured(videos.length === 0); // make featured if first video
    setFormIsPublished(true);
    setFormDisplayOrder(nextOrder);
    setVideoIdManuallyEdited(false);

    setIsModalOpen(true);
  };

  // Open modal to edit an existing video
  const handleOpenEdit = (vid: DbCreatorVideo) => {
    setEditingVideo(vid);
    setFormYoutubeUrl(vid.youtube_url || '');
    setFormVideoId(vid.video_id || '');
    setFormTitle(vid.title || '');
    setFormCategory(vid.category || '');
    setFormDuration(vid.duration || '');
    setFormThumbnailUrl(vid.thumbnail_url || '');
    setFormIsFeatured(!!vid.is_featured);
    setFormIsPublished(!!vid.is_published);
    setFormDisplayOrder(vid.display_order || 1);
    setVideoIdManuallyEdited(true);

    setIsModalOpen(true);
  };

  // Auto-extract video ID from URL when typing
  const handleUrlChange = (val: string) => {
    setFormYoutubeUrl(val);
    const extracted = extractYouTubeVideoId(val);
    if (extracted && !videoIdManuallyEdited) {
      setFormVideoId(extracted);
      if (!formThumbnailUrl) {
        setFormThumbnailUrl(getDerivedYouTubeThumbnail(extracted));
      }
    }
  };

  // Form Submit (Create or Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setStatusMessage({ type: 'error', text: 'Video title is required' });
      return;
    }

    // Determine normalized video ID and URL
    let finalVideoId = formVideoId.trim();
    if (!finalVideoId && formYoutubeUrl.trim()) {
      finalVideoId = extractYouTubeVideoId(formYoutubeUrl.trim()) || '';
    }

    const finalYoutubeUrl = getCanonicalYouTubeWatchUrl(finalVideoId, formYoutubeUrl.trim());
    const finalThumbnailUrl = formThumbnailUrl.trim() || (finalVideoId ? getDerivedYouTubeThumbnail(finalVideoId) : '');

    setIsSaving(true);
    setStatusMessage(null);

    try {
      if (editingVideo) {
        // UPDATE
        const updatePayload = {
          video_id: finalVideoId,
          title: formTitle.trim(),
          category: formCategory.trim(),
          duration: formDuration.trim() || '10:00',
          youtube_url: finalYoutubeUrl,
          thumbnail_url: finalThumbnailUrl,
          is_featured: formIsFeatured,
          is_published: formIsPublished,
          display_order: Number(formDisplayOrder) || 1,
        };

        const { success, error } = await updateAdminCreatorVideo(editingVideo.id, updatePayload);
        if (!success || error) {
          setStatusMessage({ type: 'error', text: error || 'Failed to update video' });
          setIsSaving(false);
          return;
        }

        setStatusMessage({ type: 'success', text: `Video "${formTitle}" updated successfully!` });
      } else {
        // CREATE
        const newId = `vid-${Date.now()}`;
        const insertPayload: DbCreatorVideoInsert = {
          id: newId,
          video_id: finalVideoId || `vid-${Date.now().toString().slice(-6)}`,
          title: formTitle.trim(),
          category: formCategory.trim(),
          duration: formDuration.trim() || '10:00',
          youtube_url: finalYoutubeUrl,
          thumbnail_url: finalThumbnailUrl,
          is_featured: formIsFeatured,
          display_order: Number(formDisplayOrder) || 1,
          is_published: formIsPublished,
        };

        const { data, error } = await createAdminCreatorVideo(insertPayload);
        if (error || !data) {
          setStatusMessage({ type: 'error', text: error || 'Failed to create video' });
          setIsSaving(false);
          return;
        }

        setStatusMessage({ type: 'success', text: `Video "${formTitle}" added successfully!` });
      }

      setIsModalOpen(false);
      await loadVideos();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Operation failed' });
    } finally {
      setIsSaving(false);
    }
  };

  // Reorder videos up/down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= videos.length) return;

    const listCopy = [...videos];
    const [movedItem] = listCopy.splice(index, 1);
    listCopy.splice(targetIndex, 0, movedItem);

    // Re-assign display_order sequentially
    const updatedPayload = listCopy.map((v, idx) => ({
      id: v.id,
      display_order: idx + 1,
    }));

    // Optimistic UI update
    const optimisticVideos = listCopy.map((v, idx) => ({
      ...v,
      display_order: idx + 1,
    }));
    setVideos(optimisticVideos);

    const { success, error } = await reorderAdminCreatorVideos(updatedPayload);
    if (!success) {
      setStatusMessage({ type: 'error', text: error || 'Failed to save new order' });
      await loadVideos(); // Rollback
    } else {
      setStatusMessage({ type: 'success', text: 'Video ordering updated successfully!' });
    }
  };

  // Quick toggle publish/unpublish
  const handleTogglePublish = async (vid: DbCreatorVideo) => {
    const { success, error } = await togglePublishAdminCreatorVideo(vid.id, vid.is_published);
    if (!success) {
      setStatusMessage({ type: 'error', text: error || 'Failed to update publication status' });
    } else {
      setVideos(prev => prev.map(v => v.id === vid.id ? { ...v, is_published: !v.is_published } : v));
      setStatusMessage({ 
        type: 'success', 
        text: `Video "${vid.title}" is now ${!vid.is_published ? 'Published' : 'Unpublished'}.` 
      });
    }
  };

  // Quick set featured
  const handleSetFeatured = async (vid: DbCreatorVideo) => {
    if (vid.is_featured) return; // Already featured
    const { success, error } = await setFeaturedAdminCreatorVideo(vid.id);
    if (!success) {
      setStatusMessage({ type: 'error', text: error || 'Failed to set featured video' });
    } else {
      setVideos(prev => prev.map(v => ({
        ...v,
        is_featured: v.id === vid.id,
      })));
      setStatusMessage({ type: 'success', text: `"${vid.title}" is now the Featured Video!` });
    }
  };

  // Quick remove featured
  const handleRemoveFeatured = async (vid: DbCreatorVideo) => {
    const { success, error } = await removeFeaturedAdminCreatorVideo(vid.id);
    if (!success) {
      setStatusMessage({ type: 'error', text: error || 'Failed to remove featured status' });
    } else {
      setVideos(prev => prev.map(v => v.id === vid.id ? { ...v, is_featured: false } : v));
      setStatusMessage({ type: 'success', text: `Featured status removed from "${vid.title}".` });
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);

    try {
      const { success, error } = await deleteAdminCreatorVideo(deleteCandidate.id);
      if (!success) {
        setStatusMessage({ type: 'error', text: error || 'Failed to delete video' });
      } else {
        setStatusMessage({ type: 'success', text: `Video "${deleteCandidate.title}" deleted.` });
        setDeleteCandidate(null);
        await loadVideos();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error deleting video' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Separate featured video from archive videos for the UI
  const featuredVideo = videos.find(v => v.is_featured);
  const archiveVideos = videos.filter(v => !v.is_featured);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono tracking-widest text-[#38BDF8] uppercase font-semibold">
              CREATOR CMS
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-[10px] font-mono text-red-400 font-semibold">
              <Youtube className="w-3 h-3" />
              PUBLIC.CREATOR_VIDEOS
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
            YouTube & Creator Videos
          </h1>
          <p className="text-sm font-mono text-[#94A3B8] mt-0.5">
            Manage your featured video production and archive releases shown on the public portfolio.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={loadVideos}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0E131F] hover:bg-[#141B2D] border border-white/10 text-xs font-mono text-[#CBD5E1] transition-all cursor-pointer disabled:opacity-50"
            title="Refresh from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#38BDF8] ${isLoading ? 'animate-spin' : ''}`} />
            <span>SYNC</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#60A5FA] text-[#080B11] text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.25)]"
          >
            <Plus className="w-4 h-4" />
            <span>ADD VIDEO</span>
          </button>
        </div>
      </div>

      {/* 2. Status Alert Bar */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border font-mono text-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="p-1 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-white/10 bg-[#0E131F]/50 backdrop-blur-md">
          <Loader2 className="w-8 h-8 text-[#38BDF8] animate-spin mb-3" />
          <p className="text-sm font-mono text-[#94A3B8]">Loading creator videos from Supabase...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-white/15 bg-[#0E131F]/30 text-center">
          <Youtube className="w-12 h-12 text-red-500/40 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Videos Found in Database</h3>
          <p className="text-xs font-mono text-[#94A3B8] max-w-md mb-6">
            Add a video or sync from the database to manage your public video releases.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#38BDF8] text-[#080B11] text-xs font-mono font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Video</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* =================================================================== */}
          {/* A. FEATURED VIDEO SECTION                                           */}
          {/* =================================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#38BDF8] fill-[#38BDF8]" />
                <h2 className="text-xs font-mono text-[#38BDF8] uppercase tracking-wider font-semibold">
                  FEATURED VIDEO (FLAGSHIP)
                </h2>
              </div>
              <span className="text-[10px] font-mono text-[#94A3B8]">
                {featuredVideo ? '1 Active' : 'No video marked featured (first published will be used)'}
              </span>
            </div>

            {featuredVideo ? (
              <div className="rounded-2xl border border-[#38BDF8]/40 bg-[#0E131F] p-5 shadow-[0_0_30px_rgba(56,189,248,0.08)] backdrop-blur-md">
                <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
                  {/* Thumbnail + Video Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0">
                    {/* Thumbnail preview */}
                    <div className="relative w-full sm:w-44 aspect-video rounded-xl bg-[#080B11] border border-white/10 overflow-hidden shrink-0 flex items-center justify-center group">
                      {featuredVideo.thumbnail_url || (featuredVideo.video_id ? getDerivedYouTubeThumbnail(featuredVideo.video_id) : null) ? (
                        <img 
                          src={featuredVideo.thumbnail_url || getDerivedYouTubeThumbnail(featuredVideo.video_id)} 
                          alt={featuredVideo.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play className="w-6 h-6 text-[#38BDF8] fill-[#38BDF8]" />
                      </div>
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-[#38BDF8]" />
                        {featuredVideo.duration || '12:00'}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[10px] font-mono text-[#38BDF8] font-bold">
                          <Star className="w-2.5 h-2.5 fill-[#38BDF8]" />
                          FEATURED
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                            featuredVideo.is_published
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${featuredVideo.is_published ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          {featuredVideo.is_published ? 'PUBLISHED' : 'DRAFT / UNPUBLISHED'}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {featuredVideo.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-[#94A3B8]">
                        <span className="text-[#38BDF8]">{featuredVideo.category}</span>
                        <span className="text-white/20">•</span>
                        <span>ID: <code className="text-[#CBD5E1]">{featuredVideo.video_id || 'n/a'}</code></span>
                        {featuredVideo.youtube_url && (
                          <>
                            <span className="text-white/20">•</span>
                            <a
                              href={featuredVideo.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#64748B] hover:text-[#38BDF8] flex items-center gap-1"
                            >
                              <span>Watch Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0 w-full md:w-auto justify-end">
                    <button
                      onClick={() => handleRemoveFeatured(featuredVideo)}
                      className="p-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] border border-white/10 text-[#94A3B8] hover:text-amber-400 transition-all cursor-pointer"
                      title="Unset as Featured"
                    >
                      <Star className="w-4 h-4 fill-[#38BDF8]" />
                    </button>

                    <button
                      onClick={() => handleTogglePublish(featuredVideo)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        featuredVideo.is_published
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                          : 'bg-[#141B2D] hover:bg-[#1E293B] border-white/10 text-[#94A3B8] hover:text-white'
                      }`}
                      title={featuredVideo.is_published ? 'Unpublish Video' : 'Publish Video'}
                    >
                      {featuredVideo.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleOpenEdit(featuredVideo)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] border border-white/10 hover:border-[#38BDF8]/40 text-xs font-mono text-white transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>EDIT</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-dashed border-white/10 bg-[#0E131F]/40 text-center">
                <p className="text-xs font-mono text-[#94A3B8]">
                  No featured video selected. Click the star icon on any video below to set it as featured.
                </p>
              </div>
            )}
          </div>

          {/* =================================================================== */}
          {/* B. ARCHIVE VIDEOS SECTION                                           */}
          {/* =================================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-[#CBD5E1]" />
                <h2 className="text-xs font-mono text-[#CBD5E1] uppercase tracking-wider font-semibold">
                  ARCHIVE & ADDITIONAL PRODUCTIONS ({archiveVideos.length})
                </h2>
              </div>
              <span className="text-[10px] font-mono text-[#94A3B8]">
                Public site displays the first 4 published archive videos in order
              </span>
            </div>

            <div className="space-y-3">
              {videos.map((vid, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === videos.length - 1;

                return (
                  <div
                    key={vid.id}
                    className={`group rounded-2xl border p-4 sm:p-5 transition-all backdrop-blur-md ${
                      vid.is_featured 
                        ? 'border-[#38BDF8]/30 bg-[#0E131F]/90' 
                        : vid.is_published 
                        ? 'border-white/10 bg-[#0E131F]/80 hover:border-white/20' 
                        : 'border-white/5 bg-[#080B11]/90 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Reorder + Thumbnail + Metadata */}
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                        {/* Reorder Buttons */}
                        <div className="flex flex-col gap-1 shrink-0 pt-0.5 sm:pt-0">
                          <button
                            onClick={() => handleMoveOrder(idx, 'up')}
                            disabled={isFirst}
                            className="p-1 rounded bg-[#141B2D] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white disabled:opacity-20 transition-all cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveOrder(idx, 'down')}
                            disabled={isLast}
                            className="p-1 rounded bg-[#141B2D] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white disabled:opacity-20 transition-all cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Order & Number Pill */}
                        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-[#141B2D] border border-white/10 shrink-0">
                          <span className="font-mono text-xs font-bold text-white">
                            #{vid.display_order}
                          </span>
                        </div>

                        {/* Video Thumbnail */}
                        <div className="relative w-24 sm:w-28 aspect-video rounded-lg bg-[#080B11] border border-white/10 overflow-hidden shrink-0 hidden sm:flex items-center justify-center">
                          {vid.thumbnail_url || (vid.video_id ? getDerivedYouTubeThumbnail(vid.video_id) : null) ? (
                            <img 
                              src={vid.thumbnail_url || getDerivedYouTubeThumbnail(vid.video_id)} 
                              alt={vid.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : null}
                          <Play className="w-4 h-4 text-white/60 absolute" />
                        </div>

                        {/* Video Details */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                              {vid.title}
                            </h3>

                            {vid.is_featured && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[9px] font-mono text-[#38BDF8] font-bold">
                                <Star className="w-2.5 h-2.5 fill-[#38BDF8]" />
                                FEATURED
                              </span>
                            )}

                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-medium ${
                                vid.is_published
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${vid.is_published ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                              {vid.is_published ? 'PUBLISHED' : 'DRAFT'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-[#94A3B8]">
                            <span className="text-[#38BDF8]">{vid.category}</span>
                            <span className="text-white/20">•</span>
                            <span className="text-[#CBD5E1]">{vid.duration}</span>
                            <span className="text-white/20">•</span>
                            <span className="text-[#64748B]">ID: {vid.video_id || 'n/a'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Actions */}
                      <div className="flex items-center justify-end gap-2 shrink-0 border-t lg:border-t-0 border-white/5 pt-3 lg:pt-0">
                        {/* Set / Unset Featured */}
                        <button
                          onClick={() => vid.is_featured ? handleRemoveFeatured(vid) : handleSetFeatured(vid)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            vid.is_featured 
                              ? 'bg-[#38BDF8]/15 border-[#38BDF8]/40 text-[#38BDF8]' 
                              : 'bg-[#141B2D] hover:bg-[#1E293B] border-white/10 text-[#94A3B8] hover:text-[#38BDF8]'
                          }`}
                          title={vid.is_featured ? 'Unset as Featured' : 'Set as Featured Video'}
                        >
                          <Star className={`w-4 h-4 ${vid.is_featured ? 'fill-[#38BDF8]' : ''}`} />
                        </button>

                        {/* Publish / Unpublish Toggle */}
                        <button
                          onClick={() => handleTogglePublish(vid)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            vid.is_published
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                              : 'bg-[#141B2D] hover:bg-[#1E293B] border-white/10 text-[#94A3B8] hover:text-white'
                          }`}
                          title={vid.is_published ? 'Unpublish Video' : 'Publish Video'}
                        >
                          {vid.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(vid)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] border border-white/10 hover:border-[#38BDF8]/40 text-xs font-mono text-white transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>EDIT</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteCandidate(vid)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all cursor-pointer"
                          title="Delete Video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ADD / EDIT VIDEO MODAL                                                 */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8 rounded-2xl border border-white/10 bg-[#0E131F] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141B2D]/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                  <Youtube className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingVideo ? `Edit Video: ${editingVideo.title}` : 'Add New Creator Video'}
                  </h2>
                  <p className="text-[11px] font-mono text-[#94A3B8]">
                    Configure YouTube URL, Video ID, and presentation details
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 overflow-y-auto">
              
              {/* YouTube Link / ID Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#CBD5E1] flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
                    YouTube URL or Video ID <span className="text-[#38BDF8]">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    Auto-normalizes standard links
                  </span>
                </div>
                <input
                  type="text"
                  value={formYoutubeUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-xs font-mono"
                />
              </div>

              {/* Extracted Video ID & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#CBD5E1]">
                    Normalized Video ID
                  </label>
                  <input
                    type="text"
                    value={formVideoId}
                    onChange={(e) => {
                      setFormVideoId(e.target.value);
                      setVideoIdManuallyEdited(true);
                    }}
                    placeholder="e.g., dQw4w9WgXcQ"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-[#38BDF8] text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#CBD5E1] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="e.g., 14:28"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CBD5E1]">
                  Video Title <span className="text-[#38BDF8]">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Demystifying Edge AI: Running Neural Networks on Microcontrollers"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-sm"
                />
              </div>

              {/* Category & Thumbnail URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#CBD5E1]">
                    Category Badge
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g., Edge AI & Systems"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-[#CBD5E1]">
                      Thumbnail URL (Optional)
                    </label>
                    <span className="text-[10px] font-mono text-[#94A3B8]">
                      Auto-derived from ID if blank
                    </span>
                  </div>
                  <input
                    type="url"
                    value={formThumbnailUrl}
                    onChange={(e) => setFormThumbnailUrl(e.target.value)}
                    placeholder="https://img.youtube.com/vi/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Status Controls */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-wider block font-semibold">
                  STATUS & DISPLAY CONFIGURATION
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Featured Toggle */}
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[#080B11] border border-white/10 cursor-pointer hover:border-white/20">
                    <input
                      type="checkbox"
                      checked={formIsFeatured}
                      onChange={(e) => setFormIsFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-[#38BDF8] accent-[#38BDF8]"
                    />
                    <div>
                      <span className="text-xs font-mono text-white font-bold block">Featured</span>
                      <span className="text-[10px] font-mono text-[#94A3B8]">Flagship video slot</span>
                    </div>
                  </label>

                  {/* Published Toggle */}
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[#080B11] border border-white/10 cursor-pointer hover:border-white/20">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-mono text-white font-bold block">Published</span>
                      <span className="text-[10px] font-mono text-[#94A3B8]">Visible on live site</span>
                    </div>
                  </label>

                  {/* Display Order */}
                  <div className="space-y-1">
                    <label className="text-xs font-mono text-[#CBD5E1]">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] text-xs font-mono text-[#CBD5E1] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#60A5FA] text-[#080B11] text-xs font-mono font-bold tracking-wide transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>SAVING...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingVideo ? 'UPDATE VIDEO' : 'ADD VIDEO'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DELETE CONFIRMATION DIALOG                                             */}
      {/* ========================================================================= */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#0E131F] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Video Deletion</h3>
                <span className="text-xs font-mono text-rose-400">Destructive Database Action</span>
              </div>
            </div>

            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white font-bold">"{deleteCandidate.title}"</strong> (ID:{' '}
              <span className="text-[#38BDF8] font-mono">{deleteCandidate.video_id || deleteCandidate.id}</span>)?
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] text-xs font-mono text-[#CBD5E1] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold tracking-wide transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>DELETING...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>DELETE VIDEO</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
