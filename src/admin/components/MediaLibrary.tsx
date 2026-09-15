import React, { useState, useEffect, useRef } from 'react';
import { 
  ImageIcon, 
  Upload, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Copy, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  Folder,
  FileText,
  Sparkles,
  User,
  Layers,
  Info
} from 'lucide-react';
import { 
  DbMediaItem, 
  getAdminMediaItems, 
  uploadAdminMedia, 
  deleteAdminMedia, 
  checkMediaReferences,
  updateAdminMediaAltText,
  MAX_FILE_SIZE_BYTES,
  ACCEPTED_EXTENSIONS,
  MediaUsageReference
} from '../../services/mediaService';

interface MediaLibraryProps {
  onSelectMedia?: (mediaItem: DbMediaItem) => void;
  selectedUrl?: string;
  isModalPicker?: boolean;
  onClose?: () => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onSelectMedia,
  selectedUrl,
  isModalPicker = false,
  onClose,
}) => {
  const [mediaItems, setMediaItems] = useState<DbMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadFolder, setUploadFolder] = useState<'hero' | 'about' | 'general'>('general');
  const [uploadAltText, setUploadAltText] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deletion modal state & Reference checking
  const [deleteCandidate, setDeleteCandidate] = useState<DbMediaItem | null>(null);
  const [deleteUsage, setDeleteUsage] = useState<MediaUsageReference | null>(null);
  const [isCheckingUsage, setIsCheckingUsage] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Detail / Info modal state
  const [activeMediaDetail, setActiveMediaDetail] = useState<DbMediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const { data, error } = await getAdminMediaItems();
      if (error) {
        setStatusMessage({ type: 'error', text: `Failed to load media items: ${error}` });
      } else {
        setMediaItems(data);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error loading media library' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle File Input Selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setStatusMessage({ 
        type: 'error', 
        text: `File exceeds 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB). Please choose a smaller image.` 
      });
      return;
    }

    // Validate extension / MIME
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setStatusMessage({ 
        type: 'error', 
        text: `Unsupported file type (${extension}). Allowed formats: JPG, PNG, WebP.` 
      });
      return;
    }

    setSelectedFile(file);
    setUploadAltText(file.name.substring(0, file.name.lastIndexOf('.')).replace(/[-_]/g, ' '));

    // Create object URL for local instant preview
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
    setIsUploadModalOpen(true);
  };

  // Confirm Upload Execution
  const handleConfirmUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    setStatusMessage(null);

    try {
      const { data, error } = await uploadAdminMedia(selectedFile, {
        folder: uploadFolder,
        altText: uploadAltText,
      });

      if (error || !data) {
        setStatusMessage({ type: 'error', text: error || 'Failed to upload media.' });
      } else {
        setStatusMessage({ type: 'success', text: `Uploaded "${data.file_name}" successfully!` });
        handleCloseUploadModal();
        await loadMedia();

        // If in picker mode and auto-select desired
        if (onSelectMedia) {
          onSelectMedia(data);
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Unexpected upload failure.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseUploadModal = () => {
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
    }
    setSelectedFile(null);
    setFilePreview(null);
    setUploadAltText('');
    setIsUploadModalOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger Delete Confirmation Flow with Safety Check
  const handleInitiateDelete = async (mediaItem: DbMediaItem) => {
    setDeleteCandidate(mediaItem);
    setIsCheckingUsage(true);
    setDeleteUsage(null);

    try {
      const usage = await checkMediaReferences(mediaItem);
      setDeleteUsage(usage);
    } catch (err) {
      console.warn('Error checking usage references:', err);
    } finally {
      setIsCheckingUsage(false);
    }
  };

  // Execute Confirmed Delete
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);

    try {
      const { success, error, isBlocked } = await deleteAdminMedia(deleteCandidate);
      if (!success || error) {
        setStatusMessage({ 
          type: 'error', 
          text: error || 'Failed to delete media item.' 
        });
      } else {
        setStatusMessage({ 
          type: 'success', 
          text: `Media "${deleteCandidate.file_name}" deleted from storage and catalog.` 
        });
        setDeleteCandidate(null);
        setDeleteUsage(null);
        await loadMedia();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error deleting media.' });
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy Public URL to Clipboard
  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Filter items
  const filteredMedia = mediaItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.alt_text && item.alt_text.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFolder = folderFilter === 'all' || item.file_path.startsWith(`${folderFilter}/`);

    return matchesSearch && matchesFolder;
  });

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={`space-y-6 ${isModalPicker ? 'max-w-4xl p-1' : 'max-w-6xl'}`}>
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono tracking-widest text-[#38BDF8] uppercase font-semibold">
              SUPABASE STORAGE
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[10px] font-mono text-[#38BDF8]">
              <ImageIcon className="w-3 h-3" />
              BUCKET: portfolio-media
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
            {isModalPicker ? 'Select from Media Library' : 'Media Library & Assets'}
          </h1>
          <p className="text-xs sm:text-sm font-mono text-[#94A3B8] mt-0.5">
            Upload, manage, and attach high-fidelity portfolio imagery for Hero, About, and Projects.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
          />

          <button
            onClick={loadMedia}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0E131F] hover:bg-[#141B2D] border border-white/10 text-xs font-mono text-[#CBD5E1] transition-all cursor-pointer disabled:opacity-50"
            title="Refresh from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#38BDF8] ${isLoading ? 'animate-spin' : ''}`} />
            <span>SYNC</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#60A5FA] text-[#080B11] text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.25)]"
          >
            <Upload className="w-4 h-4" />
            <span>UPLOAD IMAGE</span>
          </button>

          {isModalPicker && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Status Message Alert */}
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

      {/* 3. Search & Filter Toolbars */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#0E131F]/70 border border-white/10 backdrop-blur-md">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media by filename or alt text..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-xs font-mono placeholder-[#64748B]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Folder Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Files', icon: Layers },
            { id: 'hero', label: 'Hero', icon: Sparkles },
            { id: 'about', label: 'About', icon: User },
            { id: 'general', label: 'General', icon: Folder },
          ].map((f) => {
            const Icon = f.icon;
            const isSelected = folderFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFolderFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#38BDF8]/20 border border-[#38BDF8] text-[#38BDF8] font-bold'
                    : 'bg-[#080B11] border border-white/5 text-[#94A3B8] hover:text-white hover:border-white/15'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* 4. Media Grid Display */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-white/10 bg-[#0E131F]/50 backdrop-blur-md">
          <Loader2 className="w-8 h-8 text-[#38BDF8] animate-spin mb-3" />
          <p className="text-sm font-mono text-[#94A3B8]">Loading media from Supabase Storage...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-white/15 bg-[#0E131F]/30 text-center">
          <ImageIcon className="w-12 h-12 text-[#38BDF8]/40 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">
            {searchQuery || folderFilter !== 'all' ? 'No Matching Media Found' : 'No Media Uploaded Yet'}
          </h3>
          <p className="text-xs font-mono text-[#94A3B8] max-w-md mb-6">
            Upload JPG, PNG, or WebP images to your private storage bucket to use throughout the portfolio.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#38BDF8] text-[#080B11] text-xs font-mono font-bold"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((item) => {
            const isCurrentlySelected = selectedUrl === item.public_url;

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 bg-[#0E131F] ${
                  isCurrentlySelected
                    ? 'border-[#38BDF8] shadow-[0_0_25px_rgba(56,189,248,0.25)] ring-2 ring-[#38BDF8]'
                    : 'border-white/10 hover:border-[#38BDF8]/40 hover:bg-[#141B2D]'
                }`}
              >
                {/* Image Preview Container (Aspect ratio square) */}
                <div className="relative aspect-square w-full bg-[#080B11] overflow-hidden">
                  <img
                    src={item.public_url}
                    alt={item.alt_text || item.file_name}
                    loading="lazy"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                    }}
                  />

                  {/* Folder Tag Badge */}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#080B11]/80 backdrop-blur-sm border border-white/10 text-[9px] font-mono text-[#38BDF8] uppercase">
                    {item.file_path.split('/')[0] || 'media'}
                  </span>

                  {/* Selected Indicator Checkmark */}
                  {isCurrentlySelected && (
                    <div className="absolute top-2 right-2 p-1 rounded-full bg-[#38BDF8] text-[#080B11] shadow-lg">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}

                  {/* Quick Overlay Action on Hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                    {onSelectMedia ? (
                      <button
                        onClick={() => onSelectMedia(item)}
                        className="px-3 py-1.5 rounded-xl bg-[#38BDF8] hover:bg-[#60A5FA] text-[#080B11] font-mono text-xs font-bold transition-transform hover:scale-105 cursor-pointer shadow-md"
                      >
                        Select
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCopyUrl(item.public_url, item.id)}
                        className="p-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] text-[#38BDF8] transition-transform hover:scale-110 cursor-pointer"
                        title="Copy Public URL"
                      >
                        {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}

                    <button
                      onClick={() => setActiveMediaDetail(item)}
                      className="p-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white transition-transform hover:scale-110 cursor-pointer"
                      title="Inspect Details"
                    >
                      <Info className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleInitiateDelete(item)}
                      className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 transition-transform hover:scale-110 cursor-pointer"
                      title="Delete Image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="p-2.5 space-y-1 bg-[#0E131F]">
                  <div className="text-xs font-medium text-white truncate" title={item.file_name}>
                    {item.file_name}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B]">
                    <span>{formatFileSize(item.file_size_bytes)}</span>
                    <span className="uppercase">{item.media_type.split('/')[1] || 'img'}</span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. UPLOAD CONFIRMATION & PREVIEW MODAL                                    */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg my-8 rounded-2xl border border-white/10 bg-[#0E131F] shadow-2xl overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141B2D]/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8]">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Upload New Media Asset</h2>
                  <p className="text-[11px] font-mono text-[#94A3B8]">Review image details before uploading to Supabase Storage</p>
                </div>
              </div>
              <button
                onClick={handleCloseUploadModal}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmUpload} className="p-6 space-y-4">
              
              {/* Image Preview Box */}
              {filePreview && (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-[#080B11] flex items-center justify-center">
                  <img
                    src={filePreview}
                    alt="Upload Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-[#080B11]/80 backdrop-blur-sm text-[10px] font-mono text-[#CBD5E1] border border-white/10">
                    {selectedFile?.name} ({formatFileSize(selectedFile?.size || 0)})
                  </div>
                </div>
              )}

              {/* Destination Folder Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#CBD5E1]">
                  Target Storage Category / Folder
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'general', label: 'General', desc: 'Default catalog' },
                    { id: 'hero', label: 'Hero', desc: 'Hero photo' },
                    { id: 'about', label: 'About', desc: 'Portrait bio' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setUploadFolder(f.id as any)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                        uploadFolder === f.id
                          ? 'bg-[#38BDF8]/15 border-[#38BDF8] text-white'
                          : 'bg-[#080B11] border-white/10 text-[#94A3B8] hover:text-white hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-mono font-bold block capitalize">{f.label}</span>
                      <span className="text-[9px] font-mono text-[#64748B]">{f.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Alt Text Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[#CBD5E1]">
                    Image Alt Text / Description
                  </label>
                  <span className="text-[10px] font-mono text-[#94A3B8]">For SEO & Accessibility</span>
                </div>
                <input
                  type="text"
                  value={uploadAltText}
                  onChange={(e) => setUploadAltText(e.target.value)}
                  placeholder="e.g., Afrid Ahmed editorial portrait in dark studio setting"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseUploadModal}
                  disabled={isUploading}
                  className="px-4 py-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] text-xs font-mono text-[#CBD5E1] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#60A5FA] text-[#080B11] text-xs font-mono font-bold tracking-wide transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>UPLOADING TO STORAGE...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>CONFIRM & UPLOAD</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. DELETE CONFIRMATION & SAFETY CHECK DIALOG                              */}
      {/* ========================================================================= */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#0E131F] p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Media Asset</h3>
                <span className="text-xs font-mono text-rose-400">Supabase Storage & Catalog</span>
              </div>
            </div>

            {isCheckingUsage ? (
              <div className="flex items-center gap-2 py-4 text-xs font-mono text-[#94A3B8]">
                <Loader2 className="w-4 h-4 animate-spin text-[#38BDF8]" />
                <span>Checking if image is actively referenced in Hero/About...</span>
              </div>
            ) : deleteUsage?.isReferenced ? (
              <div className="space-y-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs">
                <div className="font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>DELETION BLOCKED: ACTIVE USAGE</span>
                </div>
                <p className="text-rose-200 leading-relaxed text-[11px]">
                  This image cannot be deleted because it is currently assigned as the active photo in:
                </p>
                <ul className="list-disc list-inside space-y-1 text-white font-mono text-[11px]">
                  {deleteUsage.locations.map((loc, idx) => (
                    <li key={idx}>
                      <strong className="text-rose-300">{loc.section} Section</strong> ({loc.field})
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-[#94A3B8] italic pt-1">
                  Please go to that section and replace or clear the image URL before deleting this asset.
                </p>
              </div>
            ) : (
              <p className="text-xs text-[#CBD5E1] leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-white font-bold">"{deleteCandidate.file_name}"</strong>?
                This file will be purged from Supabase Storage and public.media.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setDeleteCandidate(null);
                  setDeleteUsage(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] text-xs font-mono text-[#CBD5E1] cursor-pointer"
              >
                {deleteUsage?.isReferenced ? 'Close' : 'Cancel'}
              </button>

              {!deleteUsage?.isReferenced && !isCheckingUsage && (
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
                      <span>DELETE FROM STORAGE</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MEDIA DETAIL & INSPECT MODAL                                           */}
      {/* ========================================================================= */}
      {activeMediaDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0E131F] p-6 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white truncate max-w-xs">
                {activeMediaDetail.file_name}
              </h3>
              <button
                onClick={() => setActiveMediaDetail(null)}
                className="p-1 rounded-lg text-[#94A3B8] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-xl overflow-hidden bg-[#080B11] border border-white/10 flex items-center justify-center">
              <img
                src={activeMediaDetail.public_url}
                alt={activeMediaDetail.alt_text || activeMediaDetail.file_name}
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#94A3B8]">Storage Path:</span>
                <span className="text-[#38BDF8]">{activeMediaDetail.file_path}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#94A3B8]">File Size:</span>
                <span className="text-white">{formatFileSize(activeMediaDetail.file_size_bytes)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#94A3B8]">Media Type:</span>
                <span className="text-white">{activeMediaDetail.media_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[#94A3B8]">Alt Text:</span>
                <span className="text-[#CBD5E1] truncate max-w-xs">{activeMediaDetail.alt_text || 'None'}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-mono text-[#94A3B8]">Public URL:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={activeMediaDetail.public_url}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#080B11] border border-white/10 text-white text-[11px] font-mono select-all focus:outline-none"
                />
                <button
                  onClick={() => handleCopyUrl(activeMediaDetail.public_url, activeMediaDetail.id)}
                  className="px-3 py-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] text-xs font-mono text-[#38BDF8] flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === activeMediaDetail.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === activeMediaDetail.id ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              {onSelectMedia && (
                <button
                  onClick={() => {
                    onSelectMedia(activeMediaDetail);
                    setActiveMediaDetail(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#60A5FA] text-[#080B11] text-xs font-mono font-bold cursor-pointer"
                >
                  Select this Media
                </button>
              )}
              <button
                onClick={() => setActiveMediaDetail(null)}
                className="px-4 py-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] text-xs font-mono text-[#CBD5E1] cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
