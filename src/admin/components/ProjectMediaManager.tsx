import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Upload, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Star, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown, 
  Check, 
  Copy, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Sparkles,
  ExternalLink,
  Code
} from 'lucide-react';
import { DbProject } from '../../services/projectService';
import { 
  ProjectMedia, 
  ProjectMediaType 
} from '../../types';
import { 
  getAdminProjectMedia, 
  createAdminProjectMedia, 
  updateAdminProjectMedia, 
  deleteAdminProjectMedia, 
  reorderAdminProjectMedia, 
  setPrimaryAdminProjectMedia, 
  uploadProjectMediaFile,
  PROJECT_MEDIA_SQL_SCHEMA
} from '../../services/projectMediaService';

interface ProjectMediaManagerProps {
  project: DbProject;
  isOpen: boolean;
  onClose: () => void;
  onMediaUpdated?: () => void;
}

export const ProjectMediaManager: React.FC<ProjectMediaManagerProps> = ({
  project,
  isOpen,
  onClose,
  onMediaUpdated,
}) => {
  const [mediaItems, setMediaItems] = useState<ProjectMedia[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Add / Edit Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ProjectMedia | null>(null);

  // Form Fields
  const [mediaType, setMediaType] = useState<ProjectMediaType>('image');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [altText, setAltText] = useState<string>('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [isPublished, setIsPublished] = useState<boolean>(true);

  // File Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Candidate State
  const [deleteCandidate, setDeleteCandidate] = useState<ProjectMedia | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // SQL Schema View State
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Load project media on mount & when project changes
  useEffect(() => {
    if (isOpen) {
      loadMedia();
    }
  }, [isOpen, project.id]);

  const loadMedia = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const { data, error } = await getAdminProjectMedia(project.id);
      if (error) {
        setStatusMessage({ type: 'error', text: `Failed to load media: ${error}` });
      } else {
        setMediaItems(data);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error loading media' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setMediaType('image');
    setMediaUrl('');
    setCaption('');
    setAltText('');
    setDisplayOrder(mediaItems.length + 1);
    setIsFeatured(mediaItems.length === 0); // make primary if first item
    setIsPublished(true);
    setUploadFile(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: ProjectMedia) => {
    setEditingItem(item);
    setMediaType(item.mediaType);
    setMediaUrl(item.mediaUrl);
    setCaption(item.caption || '');
    setAltText(item.altText || '');
    setDisplayOrder(item.displayOrder);
    setIsFeatured(item.isFeatured);
    setIsPublished(item.isPublished);
    setUploadFile(null);
    setIsAddModalOpen(true);
  };

  // Handle local file selection with temporary object URL for modal preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');

    // Generate temporary object URL for immediate UI preview in modal
    const tempPreviewUrl = URL.createObjectURL(file);
    setMediaUrl(tempPreviewUrl);

    // Auto-generate caption / alt text if empty
    if (!caption) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[-_]/g, ' ');
      setCaption(baseName);
      setAltText(baseName);
    }
  };

  // Submit Add or Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setStatusMessage(null);

    try {
      let finalUrl = mediaUrl.trim();

      // If a file was selected, upload it to Supabase Storage
      if (uploadFile) {
        const { url, mediaType: detectedType, error: uploadErr } = await uploadProjectMediaFile(uploadFile, project.slug || project.id);
        if (uploadErr) {
          setStatusMessage({ type: 'error', text: `Storage upload failed: ${uploadErr}` });
          setIsUploading(false);
          return;
        }
        finalUrl = url;
        setMediaType(detectedType);
      }

      // Enforce persistent URL check (prevent saving blob: or data: URLs to DB)
      if (!finalUrl || finalUrl.startsWith('blob:') || finalUrl.startsWith('data:')) {
        setStatusMessage({ type: 'error', text: 'Persistent media URL from Supabase Storage is required before saving.' });
        setIsUploading(false);
        return;
      }

      if (editingItem) {
        // Update existing item
        const { success, error } = await updateAdminProjectMedia(editingItem.id, project.id, {
          media_type: mediaType,
          media_url: finalUrl,
          caption: caption.trim(),
          alt_text: altText.trim(),
          display_order: displayOrder,
          is_featured: isFeatured,
          is_published: isPublished,
        });

        if (!success) {
          setStatusMessage({ type: 'error', text: error || 'Failed to update media item in database.' });
        } else {
          setStatusMessage({ type: 'success', text: 'Media item updated and saved to Supabase Storage!' });
          setIsAddModalOpen(false);
          setUploadFile(null);
          await loadMedia();
          onMediaUpdated?.();
        }
      } else {
        // Create new item
        const { data, error } = await createAdminProjectMedia({
          project_id: project.id,
          media_type: mediaType,
          media_url: finalUrl,
          caption: caption.trim(),
          alt_text: altText.trim(),
          display_order: displayOrder,
          is_featured: isFeatured,
          is_published: isPublished,
        });

        if (error || !data) {
          setStatusMessage({ type: 'error', text: error || 'Failed to create media item in database.' });
        } else {
          setStatusMessage({ type: 'success', text: 'Media item uploaded and saved to Supabase Storage!' });
          setIsAddModalOpen(false);
          setUploadFile(null);
          await loadMedia();
          onMediaUpdated?.();
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Operation failed.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (item: ProjectMedia) => {
    try {
      const { success, error } = await updateAdminProjectMedia(item.id, project.id, {
        is_published: !item.isPublished,
      });
      if (success) {
        await loadMedia();
        onMediaUpdated?.();
      } else {
        setStatusMessage({ type: 'error', text: error || 'Failed to toggle publication' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Toggle failed' });
    }
  };

  // Set as Primary Media
  const handleSetPrimary = async (item: ProjectMedia) => {
    try {
      const { success, error } = await setPrimaryAdminProjectMedia(item.id, project.id);
      if (success) {
        setStatusMessage({ type: 'success', text: `"${item.caption || 'Item'}" set as primary project media!` });
        await loadMedia();
        onMediaUpdated?.();
      } else {
        setStatusMessage({ type: 'error', text: error || 'Failed to set primary media' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error setting primary' });
    }
  };

  // Move Order Up or Down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= mediaItems.length) return;

    const listCopy = [...mediaItems];
    const [moved] = listCopy.splice(index, 1);
    listCopy.splice(targetIndex, 0, moved);

    const reorderedPayload = listCopy.map((m, idx) => ({
      id: m.id,
      display_order: idx + 1,
    }));

    try {
      const { success } = await reorderAdminProjectMedia(reorderedPayload);
      if (success) {
        await loadMedia();
        onMediaUpdated?.();
      }
    } catch (err: any) {
      console.warn('Reorder note:', err);
    }
  };

  // Delete Media
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      const { success, error } = await deleteAdminProjectMedia(deleteCandidate.id, deleteCandidate.mediaUrl);
      if (success) {
        setStatusMessage({ type: 'success', text: 'Media deleted successfully!' });
        setDeleteCandidate(null);
        await loadMedia();
        onMediaUpdated?.();
      } else {
        setStatusMessage({ type: 'error', text: error || 'Failed to delete media' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Delete error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(PROJECT_MEDIA_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                  Project Media Stage
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-primary)]">
                  {project.title}
                </span>
              </div>
              <p className="text-xs font-mono text-[var(--text-secondary)]">
                Upload and organize photos, screenshots, and videos for the public Work section
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              title="View Supabase SQL schema"
            >
              <Code className="w-3.5 h-3.5 text-[var(--text-primary)]" />
              <span>SQL Schema</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className="px-6 py-2.5 text-xs font-mono flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-primary)]">
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="p-0.5 hover:opacity-75 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
            <div>
              <span className="text-xs font-mono text-[var(--text-primary)] font-semibold block">
                MEDIA ASSETS ({mediaItems.length})
              </span>
              <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                {mediaItems.filter(m => m.isPublished).length} published · {mediaItems.filter(m => m.isFeatured).length > 0 ? 'Primary set' : 'No primary'}
              </span>
            </div>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>ADD MEDIA</span>
            </button>
          </div>

          {/* Media Items List */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
              <Loader2 className="w-8 h-8 text-[var(--text-primary)] animate-spin mb-2" />
              <span className="font-mono text-xs">Loading media assets...</span>
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-elevated)]">
              <ImageIcon className="w-10 h-10 text-[var(--text-muted)] mb-3" />
              <h4 className="text-[var(--text-primary)] font-semibold text-sm mb-1">No media added yet</h4>
              <p className="text-xs font-mono text-[var(--text-secondary)] max-w-sm mb-4">
                Add real photographs, screenshots, architecture diagrams, or video recordings for {project.title}.
              </p>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[var(--text-primary)]" />
                <span>Upload First Media</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {mediaItems.map((item, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === mediaItems.length - 1;

                return (
                  <div
                    key={item.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-xl border transition-all ${
                      item.isFeatured
                        ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-sm'
                        : item.isPublished
                        ? 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] opacity-70'
                    }`}
                  >
                    {/* Left: Reorder + Preview + Details */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          onClick={() => handleMoveOrder(idx, 'up')}
                          disabled={isFirst}
                          className="p-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all cursor-pointer"
                          title="Move up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(idx, 'down')}
                          disabled={isLast}
                          className="p-1 rounded bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all cursor-pointer"
                          title="Move down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Thumbnail Preview */}
                      <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-[var(--bg-canvas)] border border-[var(--border-subtle)] shrink-0 flex items-center justify-center">
                        {item.mediaType === 'image' ? (
                          <img
                            src={item.mediaUrl}
                            alt={item.caption || 'Project media'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full bg-[var(--bg-elevated)] text-[var(--text-primary)]">
                            <VideoIcon className="w-5 h-5" />
                          </div>
                        )}
                        <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/75 text-[8px] font-mono text-white uppercase">
                          {item.mediaType === 'video' ? 'VID' : 'IMG'}
                        </span>
                      </div>

                      {/* Info & Badges */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[220px] sm:max-w-xs">
                            {item.caption || 'Untitled Media'}
                          </span>

                          {/* Primary / Featured badge */}
                          {item.isFeatured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent-solid)] text-[var(--accent-contrast)] text-[9px] font-mono font-bold">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              PRIMARY
                            </span>
                          )}

                          {/* Published status */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-medium border ${
                              item.isPublished
                                ? 'bg-[var(--bg-elevated)] border-[var(--border-strong)] text-[var(--text-primary)]'
                                : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {item.isPublished ? 'PUBLISHED' : 'DRAFT'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-secondary)]">
                          <span>Order: #{item.displayOrder}</span>
                          <span>•</span>
                          <a
                            href={item.mediaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 hover:text-[var(--text-primary)] truncate max-w-[180px]"
                          >
                            <span>view asset</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 border-[var(--border-subtle)] pt-2 sm:pt-0">
                      {/* Set as Primary Button */}
                      {!item.isFeatured && (
                        <button
                          onClick={() => handleSetPrimary(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-[11px] font-mono transition-all cursor-pointer"
                          title="Make primary media for project"
                        >
                          SET PRIMARY
                        </button>
                      )}

                      {/* Publish Toggle */}
                      <button
                        onClick={() => handleTogglePublish(item)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          item.isPublished
                            ? 'bg-[var(--accent-solid)] text-[var(--accent-contrast)] border-[var(--accent-solid)] hover:opacity-90'
                            : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                        title={item.isPublished ? 'Unpublish' : 'Publish'}
                      >
                        {item.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-primary)] transition-all cursor-pointer"
                        title="Edit details"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteCandidate(item)}
                        className="p-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--accent-solid)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent-contrast)] transition-all cursor-pointer"
                        title="Delete media"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)] flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
          <span>Project Slug: /{project.slug}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-primary)] text-xs font-mono transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ADD / EDIT MEDIA ITEM SUB-MODAL                                        */}
      {/* ===================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                {editingItem ? 'Edit Project Media' : 'Add Project Media'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {/* Media Source Options */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[var(--text-secondary)]">
                  Media Source (File or Direct URL) <span className="text-[var(--text-primary)]">*</span>
                </label>

                {/* Upload file button */}
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                      <span>{uploadFile ? 'Change File' : 'Choose Local File'}</span>
                    </button>
                    {uploadFile && (
                      <span className="text-xs font-mono text-[var(--text-primary)] truncate max-w-xs">
                        {uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      placeholder="...or paste external media URL (https://...)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Media Type & Display Order */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[var(--text-secondary)]">Media Type</label>
                  <select
                    value={mediaType}
                    onChange={(e) => setMediaType(e.target.value as ProjectMediaType)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-mono focus:border-[var(--border-strong)] focus:outline-none"
                  >
                    <option value="image">Image (Photo / Screenshot)</option>
                    <option value="video">Video (MP4 / WebM)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[var(--text-secondary)]">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-mono focus:border-[var(--border-strong)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Caption */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[var(--text-secondary)]">
                  Caption <span className="text-[var(--text-muted)]">(shown in viewer)</span>
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g., Physical sensor prototype telemetry"
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs font-sans"
                />
              </div>

              {/* Alt Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[var(--text-secondary)]">Alt Text</label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="e.g., AquaSense hardware enclosure"
                  className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs font-sans"
                />
              </div>

              {/* Flags: Primary & Published */}
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border-strong)] bg-[var(--bg-elevated)] accent-[var(--accent-solid)]"
                  />
                  <span className="text-xs font-mono text-[var(--text-secondary)]">
                    Set as Primary Media (default view for project)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 rounded border-[var(--border-strong)] bg-[var(--bg-elevated)] accent-[var(--accent-solid)]"
                  />
                  <span className="text-xs font-mono text-[var(--text-secondary)]">
                    Published (visible publicly on portfolio)
                  </span>
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-mono font-bold tracking-wide transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingItem ? 'Save Changes' : 'Add to Project'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DELETE CONFIRMATION MODAL                                              */}
      {/* ===================================================================== */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[var(--text-primary)]">
              <div className="p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-[var(--text-primary)]">Delete Media Item</h4>
            </div>
            <p className="text-xs font-mono text-[var(--text-secondary)]">
              Are you sure you want to delete &ldquo;{deleteCandidate.caption || 'this media item'}&rdquo;? If stored in portfolio-media, the asset will also be removed.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-mono font-bold transition-all cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SQL SCHEMA MODAL (For Supabase SQL Editor)                             */}
      {/* ===================================================================== */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] shrink-0">
              <div className="flex items-center gap-2 text-[var(--text-primary)]">
                <Code className="w-5 h-5" />
                <h4 className="text-base font-bold text-[var(--text-primary)]">Supabase Schema: public.project_media</h4>
              </div>
              <button onClick={() => setIsSqlModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-mono text-[var(--text-secondary)] shrink-0">
              Run this script once in your Supabase project SQL Editor to enable the persistent <code className="text-[var(--text-primary)] font-semibold">public.project_media</code> table with RLS security policies.
            </p>

            <pre className="flex-1 overflow-y-auto p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-primary)] leading-relaxed select-all">
              {PROJECT_MEDIA_SQL_SCHEMA}
            </pre>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] shrink-0">
              <span className="text-[11px] font-mono text-[var(--text-primary)] font-semibold">
                {copiedSql ? '✓ Copied to clipboard!' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'COPIED!' : 'COPY SQL'}</span>
                </button>
                <button
                  onClick={() => setIsSqlModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
