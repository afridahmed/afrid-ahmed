import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ImageIcon,
  Link,
  Tag,
  Type,
  FileText,
  FolderOpen,
  X
} from 'lucide-react';
import { 
  DbHeroContent, 
  DEFAULT_DB_HERO, 
  getAdminHeroContent, 
  saveAdminHeroContent 
} from '../../services/contentService';
import { MediaLibrary } from './MediaLibrary';
import { DbMediaItem } from '../../services/mediaService';

export const HeroEditor: React.FC = () => {
  const [formData, setFormData] = useState<DbHeroContent>(DEFAULT_DB_HERO);
  const [initialData, setInitialData] = useState<DbHeroContent>(DEFAULT_DB_HERO);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [newPhrase, setNewPhrase] = useState<string>('');
  const [isMediaModalOpen, setIsMediaModalOpen] = useState<boolean>(false);

  // Load from Supabase on mount
  useEffect(() => {
    loadHeroData();
  }, []);

  const loadHeroData = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    const { data, error } = await getAdminHeroContent();
    if (error) {
      setStatusMessage({ type: 'error', text: `Failed to load from database: ${error}` });
      setFormData(DEFAULT_DB_HERO);
      setInitialData(DEFAULT_DB_HERO);
    } else if (data) {
      setFormData(data);
      setInitialData(data);
    } else {
      // Row doesn't exist yet in Supabase, pre-fill with defaults
      setFormData(DEFAULT_DB_HERO);
      setInitialData(DEFAULT_DB_HERO);
    }
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    // Basic validation
    if (!formData.name.trim()) {
      setStatusMessage({ type: 'error', text: 'Name field cannot be empty.' });
      setIsSaving(false);
      return;
    }
    if (formData.rotating_phrases.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please add at least one rotating statement.' });
      setIsSaving(false);
      return;
    }

    const { success, error } = await saveAdminHeroContent(formData);
    if (success) {
      setInitialData(formData);
      setStatusMessage({ type: 'success', text: 'Hero content updated and published successfully!' });
    } else {
      setStatusMessage({ type: 'error', text: error || 'Failed to save changes to database.' });
    }
    setIsSaving(false);
  };

  const handleReset = () => {
    setFormData(initialData);
    setStatusMessage(null);
  };

  // Rotating phrases handlers
  const handleAddPhrase = () => {
    if (!newPhrase.trim()) return;
    setFormData((prev) => ({
      ...prev,
      rotating_phrases: [...prev.rotating_phrases, newPhrase.trim()],
    }));
    setNewPhrase('');
  };

  const handleRemovePhrase = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rotating_phrases: prev.rotating_phrases.filter((_, i) => i !== index),
    }));
  };

  const handleMovePhrase = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.rotating_phrases.length) return;
    
    const updated = [...formData.rotating_phrases];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setFormData((prev) => ({
      ...prev,
      rotating_phrases: updated,
    }));
  };

  const handlePhraseChange = (index: number, value: string) => {
    const updated = [...formData.rotating_phrases];
    updated[index] = value;
    setFormData((prev) => ({
      ...prev,
      rotating_phrases: updated,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3 font-mono text-xs text-[#94A3B8]">
        <Loader2 className="w-6 h-6 text-[#38BDF8] animate-spin" />
        <span>FETCHING HERO CONTENT FROM SUPABASE...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="text-xs font-mono text-[#38BDF8] tracking-widest uppercase">
            CONTENT MANAGEMENT
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#38BDF8]" />
            <span>Hero Content Editor</span>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1 font-light">
            Edit the primary headline, rotating statements, hero description, image URL, and CTA links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl bg-[#0E131F] hover:bg-[#141B2D] border border-white/10 text-xs font-mono text-[#94A3B8] hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#080B11] font-bold text-xs font-mono transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>SAVING...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>SAVE CHANGES</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-3 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Core Identity Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0E131F]/80 p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 text-xs font-mono text-[#38BDF8] uppercase tracking-wider">
            <Type className="w-4 h-4" />
            <span>PRIMARY IDENTITY & HEADLINES</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1]">
                FULL NAME
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="AFRID AHMED"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Identity Badge */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1]">
                IDENTITY BADGE / DEGREE TRACK
              </label>
              <input
                type="text"
                value={formData.identity}
                onChange={(e) => setFormData({ ...formData, identity: e.target.value })}
                placeholder="COMPUTER SCIENCE"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Tagline */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1]">
                HERO TAGLINE
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="BUILDING WHAT'S NEXT."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1]">
                HERO SUMMARY DESCRIPTION
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Computer Science undergraduate building with AI, software and code..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs leading-relaxed focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Rotating Phrases Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0E131F]/80 p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#38BDF8] uppercase tracking-wider">
              <Tag className="w-4 h-4" />
              <span>DYNAMIC ROTATING PHRASES</span>
            </div>
            <span className="text-[11px] font-mono text-[#64748B]">
              {formData.rotating_phrases.length} ACTIVE STATEMENTS
            </span>
          </div>

          <div className="space-y-3">
            {formData.rotating_phrases.map((phrase, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#080B11] border border-white/10"
              >
                <span className="w-6 text-center text-xs font-mono text-[#64748B] select-none">
                  #{idx + 1}
                </span>
                <input
                  type="text"
                  value={phrase}
                  onChange={(e) => handlePhraseChange(idx, e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-transparent text-white text-xs font-mono focus:outline-none focus:bg-[#141B2D]"
                />
                
                {/* Reorder Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMovePhrase(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 disabled:opacity-20 cursor-pointer"
                    title="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMovePhrase(idx, 'down')}
                    disabled={idx === formData.rotating_phrases.length - 1}
                    className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 disabled:opacity-20 cursor-pointer"
                    title="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemovePhrase(idx)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                    title="Delete statement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Phrase Input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPhrase();
                  }
                }}
                placeholder="Add new phrase (e.g. 'I BUILD.')"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
              <button
                type="button"
                onClick={handleAddPhrase}
                disabled={!newPhrase.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#141B2D] hover:bg-[#1A233A] border border-white/10 text-xs font-mono text-[#38BDF8] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD PHRASE</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hero Photo URL Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0E131F]/80 p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#38BDF8] uppercase tracking-wider">
              <ImageIcon className="w-4 h-4" />
              <span>HERO PROFILE PHOTO</span>
            </div>
            <button
              type="button"
              onClick={() => setIsMediaModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/30 text-xs font-mono text-[#38BDF8] font-bold transition-all cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>CHOOSE FROM MEDIA LIBRARY</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            <div className="md:col-span-8 space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[#CBD5E1]">
                  IMAGE URL / STORAGE ASSET PATH
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.hero_image_url}
                    onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                    placeholder="/images/afrid-hero.jpg or https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
                  />
                  {formData.hero_image_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, hero_image_url: '' })}
                      className="p-2.5 rounded-xl bg-[#141B2D] hover:bg-rose-500/20 text-[#94A3B8] hover:text-rose-400 border border-white/10 cursor-pointer"
                      title="Clear Image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMediaModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#141B2D] hover:bg-[#1E293B] border border-white/10 text-[11px] font-mono text-[#38BDF8] cursor-pointer"
                >
                  Browse Supabase Storage
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, hero_image_url: '/images/afrid-hero.jpg' })}
                  className="px-3 py-1.5 rounded-lg bg-[#080B11] hover:bg-[#141B2D] border border-white/10 text-[11px] font-mono text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  Use Static Asset Fallback
                </button>
              </div>

              <p className="text-[11px] text-[#64748B] font-mono">
                Select an uploaded image from Supabase Storage or specify an external/static image path.
              </p>
            </div>

            {/* Thumbnail Preview */}
            <div className="md:col-span-4 flex flex-col items-center justify-center gap-2">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/15 bg-[#080B11] shadow-lg">
                {formData.hero_image_url ? (
                  <img
                    src={formData.hero_image_url}
                    alt="Hero Preview"
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/afrid-hero.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#64748B]">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-mono text-[#94A3B8]">
                {formData.hero_image_url ? 'Active Preview' : 'No Image Set'}
              </span>
            </div>
          </div>
        </div>

        {/* Call to Action Buttons Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0E131F]/80 p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 text-xs font-mono text-[#38BDF8] uppercase tracking-wider">
            <Link className="w-4 h-4" />
            <span>HERO CALL TO ACTION BUTTONS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Primary CTA */}
            <div className="space-y-3 p-4 rounded-xl bg-[#080B11] border border-white/5">
              <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase block">
                PRIMARY ACTION BUTTON
              </span>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-[#94A3B8]">LABEL</label>
                <input
                  type="text"
                  value={formData.primary_cta_label}
                  onChange={(e) => setFormData({ ...formData, primary_cta_label: e.target.value })}
                  placeholder="EXPLORE WORK"
                  className="w-full px-3 py-2 rounded-lg bg-[#0E131F] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-[#94A3B8]">TARGET ANCHOR / URL</label>
                <input
                  type="text"
                  value={formData.primary_cta_url}
                  onChange={(e) => setFormData({ ...formData, primary_cta_url: e.target.value })}
                  placeholder="#projects"
                  className="w-full px-3 py-2 rounded-lg bg-[#0E131F] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            </div>

            {/* Secondary CTA */}
            <div className="space-y-3 p-4 rounded-xl bg-[#080B11] border border-white/5">
              <span className="text-[11px] font-mono text-[#38BDF8] font-semibold uppercase block">
                SECONDARY ACTION BUTTON
              </span>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-[#94A3B8]">LABEL</label>
                <input
                  type="text"
                  value={formData.secondary_cta_label}
                  onChange={(e) => setFormData({ ...formData, secondary_cta_label: e.target.value })}
                  placeholder="LET'S WORK TOGETHER"
                  className="w-full px-3 py-2 rounded-lg bg-[#0E131F] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-[#94A3B8]">TARGET ANCHOR / URL</label>
                <input
                  type="text"
                  value={formData.secondary_cta_url}
                  onChange={(e) => setFormData({ ...formData, secondary_cta_url: e.target.value })}
                  placeholder="#contact"
                  className="w-full px-3 py-2 rounded-lg bg-[#0E131F] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl bg-[#0E131F] hover:bg-[#141B2D] border border-white/10 text-xs font-mono text-[#94A3B8] hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            RESET CHANGES
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#080B11] font-bold text-xs font-mono transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.25)] disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>SAVING CHANGES...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>SAVE & PUBLISH TO HERO</span>
              </>
            )}
          </button>
        </div>

      </form>

      {/* Media Library Selector Modal */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-5xl my-8 rounded-2xl border border-white/10 bg-[#080B11] p-6 shadow-2xl overflow-hidden">
            <MediaLibrary
              isModalPicker={true}
              selectedUrl={formData.hero_image_url}
              onSelectMedia={(mediaItem) => {
                setFormData((prev) => ({ ...prev, hero_image_url: mediaItem.public_url }));
                setIsMediaModalOpen(false);
              }}
              onClose={() => setIsMediaModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
