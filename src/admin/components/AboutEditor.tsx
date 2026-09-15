import React, { useState, useEffect } from 'react';
import { 
  User, 
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
  Quote,
  GraduationCap,
  Layers,
  FileText,
  FolderOpen,
  X
} from 'lucide-react';
import { 
  DbAboutContent, 
  DEFAULT_DB_ABOUT, 
  getAdminAboutContent, 
  saveAdminAboutContent 
} from '../../services/contentService';
import { TechStackGroup } from '../../types';
import { MediaLibrary } from './MediaLibrary';
import { DbMediaItem } from '../../services/mediaService';

export const AboutEditor: React.FC = () => {
  const [formData, setFormData] = useState<DbAboutContent>(DEFAULT_DB_ABOUT);
  const [initialData, setInitialData] = useState<DbAboutContent>(DEFAULT_DB_ABOUT);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newBioParagraph, setNewBioParagraph] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newSkillItem, setNewSkillItem] = useState<{ [categoryIndex: number]: string }>({});
  const [isMediaModalOpen, setIsMediaModalOpen] = useState<boolean>(false);

  useEffect(() => {
    loadAboutData();
  }, []);

  const loadAboutData = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    const { data, error } = await getAdminAboutContent();
    if (error) {
      setStatusMessage({ type: 'error', text: `Failed to load from database: ${error}` });
      setFormData(DEFAULT_DB_ABOUT);
      setInitialData(DEFAULT_DB_ABOUT);
    } else if (data) {
      setFormData(data);
      setInitialData(data);
    } else {
      setFormData(DEFAULT_DB_ABOUT);
      setInitialData(DEFAULT_DB_ABOUT);
    }
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    if (!formData.heading.trim()) {
      setStatusMessage({ type: 'error', text: 'About heading cannot be empty.' });
      setIsSaving(false);
      return;
    }
    const currentBio = formData.biography ?? formData.bio ?? [];
    if (currentBio.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please provide at least one biography paragraph.' });
      setIsSaving(false);
      return;
    }

    const { success, error } = await saveAdminAboutContent(formData);
    if (success) {
      setInitialData(formData);
      setStatusMessage({ type: 'success', text: 'About narrative and pillars updated successfully!' });
    } else {
      setStatusMessage({ type: 'error', text: error || 'Failed to save changes to database.' });
    }
    setIsSaving(false);
  };

  const handleReset = () => {
    setFormData(initialData);
    setStatusMessage(null);
  };

  // Biography Handlers
  const handleAddBio = () => {
    if (!newBioParagraph.trim()) return;
    const currentBio = formData.biography ?? formData.bio ?? [];
    const nextBio = [...currentBio, newBioParagraph.trim()];
    setFormData((prev) => ({
      ...prev,
      biography: nextBio,
      bio: nextBio,
    }));
    setNewBioParagraph('');
  };

  const handleRemoveBio = (index: number) => {
    const currentBio = formData.biography ?? formData.bio ?? [];
    const nextBio = currentBio.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      biography: nextBio,
      bio: nextBio,
    }));
  };

  const handleMoveBio = (index: number, direction: 'up' | 'down') => {
    const currentBio = formData.biography ?? formData.bio ?? [];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentBio.length) return;
    
    const updated = [...currentBio];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setFormData((prev) => ({
      ...prev,
      biography: updated,
      bio: updated,
    }));
  };

  const handleBioChange = (index: number, value: string) => {
    const currentBio = formData.biography ?? formData.bio ?? [];
    const updated = [...currentBio];
    updated[index] = value;
    setFormData((prev) => ({
      ...prev,
      biography: updated,
      bio: updated,
    }));
  };

  // Tech Stack & Pillar Handlers
  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    setFormData((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        { category: newCategoryName.trim(), items: [] }
      ],
    }));
    setNewCategoryName('');
  };

  const handleRemoveCategory = (catIdx: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== catIdx),
    }));
  };

  const handleCategoryNameChange = (catIdx: number, newName: string) => {
    const updated = [...formData.skills];
    updated[catIdx] = {
      ...updated[catIdx],
      category: newName,
    };
    setFormData((prev) => ({
      ...prev,
      skills: updated,
    }));
  };

  const handleMoveCategory = (catIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? catIdx - 1 : catIdx + 1;
    if (targetIdx < 0 || targetIdx >= formData.skills.length) return;

    const updated = [...formData.skills];
    const [moved] = updated.splice(catIdx, 1);
    updated.splice(targetIdx, 0, moved);

    setFormData((prev) => ({
      ...prev,
      skills: updated,
    }));
  };

  const handleAddSkillToCategory = (catIdx: number) => {
    const skill = newSkillItem[catIdx]?.trim();
    if (!skill) return;

    const updated = [...formData.skills];
    const currentItems = Array.isArray(updated[catIdx].items) ? updated[catIdx].items : [];
    updated[catIdx] = {
      ...updated[catIdx],
      items: [...currentItems, skill],
    };

    setFormData((prev) => ({
      ...prev,
      skills: updated,
    }));

    setNewSkillItem((prev) => ({ ...prev, [catIdx]: '' }));
  };

  const handleRemoveSkillFromCategory = (catIdx: number, itemIdx: number) => {
    const updated = [...formData.skills];
    const currentItems = Array.isArray(updated[catIdx].items) ? updated[catIdx].items : [];
    updated[catIdx] = {
      ...updated[catIdx],
      items: currentItems.filter((_, i) => i !== itemIdx),
    };

    setFormData((prev) => ({
      ...prev,
      skills: updated,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3 font-mono text-xs text-[#94A3B8]">
        <Loader2 className="w-6 h-6 text-[#38BDF8] animate-spin" />
        <span>FETCHING ABOUT CONTENT FROM SUPABASE...</span>
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
            <User className="w-6 h-6 text-[#38BDF8]" />
            <span>About Narrative & Pillars</span>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1 font-light">
            Curate the biographical narrative, philosophical quote, image caption, and categorized skill groups.
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

      {/* Status Banner */}
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
        
        {/* Core Headers Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0E131F]/80 p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 text-xs font-mono text-[#38BDF8] uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>SECTION HEADINGS & STATEMENTS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Heading / Section Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1]">
                SECTION HEADING
              </label>
              <input
                type="text"
                value={formData.heading}
                onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                placeholder="ABOUT AFRID"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Badge */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1]">
                SECTION BADGE / TAG
              </label>
              <input
                type="text"
                value={formData.badge}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                placeholder="THE PERSON BEHIND THE CODE"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Large Statement */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1]">
                HIGHLIGHT STATEMENT
              </label>
              <input
                type="text"
                value={formData.statement}
                onChange={(e) => setFormData({ ...formData, statement: e.target.value })}
                placeholder="CURIOUS BY DEFAULT. BUILDING BY CHOICE."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>
        </div>

        {/* Biography Paragraphs Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0E131F]/80 p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#38BDF8] uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>EDITORIAL BIOGRAPHY PARAGRAPHS</span>
            </div>
            <span className="text-[11px] font-mono text-[#64748B]">
              {(formData.biography || formData.bio || []).length} PARAGRAPHS
            </span>
          </div>

          <div className="space-y-4">
            {(formData.biography || formData.bio || []).map((para, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl bg-[#080B11] border border-white/10 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
                  <span>PARAGRAPH #{idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveBio(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded text-[#94A3B8] hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveBio(idx, 'down')}
                      disabled={idx === (formData.biography || formData.bio || []).length - 1}
                      className="p-1 rounded text-[#94A3B8] hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveBio(idx)}
                      className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                      title="Delete paragraph"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={para}
                  onChange={(e) => handleBioChange(idx, e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0E131F] border border-white/5 text-white text-xs leading-relaxed focus:outline-none focus:border-[#38BDF8]"
                />
              </div>
            ))}

            {/* Add Paragraph Input */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-mono text-[#CBD5E1]">
                ADD NEW BIOGRAPHY PARAGRAPH
              </label>
              <textarea
                rows={3}
                value={newBioParagraph}
                onChange={(e) => setNewBioParagraph(e.target.value)}
                placeholder="Write new paragraph narrative..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs leading-relaxed focus:outline-none focus:border-[#38BDF8]"
              />
              <button
                type="button"
                onClick={handleAddBio}
                disabled={!newBioParagraph.trim()}
                className="px-4 py-2 rounded-xl bg-[#141B2D] hover:bg-[#1A233A] border border-white/10 text-xs font-mono text-[#38BDF8] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>APPEND PARAGRAPH</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quote & Academic Tag Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0E131F]/80 p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 text-xs font-mono text-[#38BDF8] uppercase tracking-wider">
            <Quote className="w-4 h-4" />
            <span>PHILOSOPHY QUOTE & ACADEMIC TAG</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Quote */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1]">
                PHILOSOPHICAL QUOTE
              </label>
              <textarea
                rows={2}
                value={formData.quote}
                onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                placeholder="Every complex system starts with curiosity, a clean terminal..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs italic focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Graduation Tag */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1]">
                GRADUATION TAG
              </label>
              <input
                type="text"
                value={formData.graduation_tag}
                onChange={(e) => setFormData({ ...formData, graduation_tag: e.target.value })}
                placeholder="EXPECTED GRADUATION: 2030"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Photo Caption Role */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1]">
                PHOTO CAPTION ROLE
              </label>
              <input
                type="text"
                value={formData.photo_caption_role}
                onChange={(e) => setFormData({ ...formData, photo_caption_role: e.target.value })}
                placeholder="CS UNDERGRADUATE · CREATOR"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>
        </div>

        {/* About Photo URL Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0E131F]/80 p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#38BDF8] uppercase tracking-wider">
              <ImageIcon className="w-4 h-4" />
              <span>EDITORIAL PORTRAIT PHOTO</span>
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
                  PORTRAIT IMAGE URL / STORAGE ASSET PATH
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.about_image_url}
                    onChange={(e) => setFormData({ ...formData, about_image_url: e.target.value })}
                    placeholder="/images/afrid-about.jpg or https://..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
                  />
                  {formData.about_image_url && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, about_image_url: '' })}
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
                  onClick={() => setFormData({ ...formData, about_image_url: '/images/afrid-about.jpg' })}
                  className="px-3 py-1.5 rounded-lg bg-[#080B11] hover:bg-[#141B2D] border border-white/10 text-[11px] font-mono text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  Use Static Asset Fallback
                </button>
              </div>

              <p className="text-[11px] text-[#64748B] font-mono">
                Select an uploaded portrait image from Supabase Storage or specify a local static asset path.
              </p>
            </div>

            {/* Thumbnail Preview */}
            <div className="md:col-span-4 flex flex-col items-center justify-center gap-2">
              <div className="relative w-24 h-32 rounded-xl overflow-hidden border-2 border-white/15 bg-[#080B11] shadow-lg">
                {formData.about_image_url ? (
                  <img
                    src={formData.about_image_url}
                    alt="About Preview"
                    className="w-full h-full object-cover object-center"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/afrid-about.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#64748B]">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-mono text-[#94A3B8]">
                {formData.about_image_url ? 'Active Portrait' : 'No Image Set'}
              </span>
            </div>
          </div>
        </div>

        {/* Categorized Skills & Tech Stack Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0E131F]/80 p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-xs font-mono text-[#38BDF8] uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>CATEGORIZED TECHNICAL PILLARS & SKILLS</span>
            </div>
            <span className="text-[11px] font-mono text-[#64748B]">
              {formData.skills.length} CATEGORIES
            </span>
          </div>

          <div className="space-y-4">
            {formData.skills.map((group, catIdx) => (
              <div
                key={catIdx}
                className="p-4 rounded-xl bg-[#080B11] border border-white/10 space-y-3"
              >
                {/* Category Header Bar with Controlled Input, Reorder, and Remove */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <div className="flex-1 flex items-center gap-2">
                    <label className="text-[10px] font-mono text-[#94A3B8] uppercase shrink-0">
                      CATEGORY:
                    </label>
                    <input
                      type="text"
                      value={group.category}
                      onChange={(e) => handleCategoryNameChange(catIdx, e.target.value)}
                      placeholder="e.g. Languages"
                      className="flex-1 max-w-xs px-3 py-1.5 rounded-lg bg-[#0E131F] border border-white/10 text-xs font-mono font-semibold text-[#38BDF8] focus:outline-none focus:border-[#38BDF8]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {/* Move Up */}
                    <button
                      type="button"
                      onClick={() => handleMoveCategory(catIdx, 'up')}
                      disabled={catIdx === 0}
                      className="p-1.5 rounded-lg bg-[#0E131F] hover:bg-[#141B2D] border border-white/10 text-[#94A3B8] hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Move Group Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      onClick={() => handleMoveCategory(catIdx, 'down')}
                      disabled={catIdx === formData.skills.length - 1}
                      className="p-1.5 rounded-lg bg-[#0E131F] hover:bg-[#141B2D] border border-white/10 text-[#94A3B8] hover:text-white disabled:opacity-20 cursor-pointer"
                      title="Move Group Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Remove Group */}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(catIdx)}
                      className="px-2.5 py-1.5 rounded-lg bg-[#141B2D] hover:bg-rose-500/20 text-xs font-mono text-rose-400 hover:text-rose-300 border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                      title="Remove Category Group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>REMOVE GROUP</span>
                    </button>
                  </div>
                </div>

                {/* Skills Container */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-mono text-[#64748B] uppercase">
                    SKILL ITEMS ({(group.items || []).length})
                  </div>
                  
                  {/* Skill Chips */}
                  <div className="flex flex-wrap gap-2 min-h-[32px] p-2 rounded-lg bg-[#050812] border border-white/5">
                    {(group.items || []).length === 0 ? (
                      <span className="text-[11px] font-mono text-[#475569] italic">
                        No skills in this category yet. Add one below.
                      </span>
                    ) : (
                      (group.items || []).map((item, itemIdx) => (
                        <span
                          key={itemIdx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0E131F] border border-white/10 text-xs font-mono text-[#CBD5E1]"
                        >
                          <span>{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkillFromCategory(catIdx, itemIdx)}
                            className="text-[#64748B] hover:text-rose-400 cursor-pointer p-0.5 rounded transition-colors"
                            title={`Remove ${item}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Skill to Group Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newSkillItem[catIdx] || ''}
                    onChange={(e) => setNewSkillItem({ ...newSkillItem, [catIdx]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkillToCategory(catIdx);
                      }
                    }}
                    placeholder={`Add skill item to ${group.category || 'group'}...`}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-[#0E131F] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkillToCategory(catIdx)}
                    disabled={!newSkillItem[catIdx]?.trim()}
                    className="px-3.5 py-1.5 rounded-lg bg-[#141B2D] hover:bg-[#1E293B] border border-white/10 text-xs font-mono text-[#38BDF8] disabled:opacity-40 cursor-pointer transition-colors"
                  >
                    + ADD SKILL
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Category Input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                placeholder="New Category Name (e.g. 'Cloud & DevOps')"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2.5 rounded-xl bg-[#141B2D] hover:bg-[#1A233A] border border-white/10 text-xs font-mono text-[#38BDF8] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD CATEGORY</span>
              </button>
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
                <span>SAVE & PUBLISH TO ABOUT</span>
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
              selectedUrl={formData.about_image_url}
              onSelectMedia={(mediaItem) => {
                setFormData((prev) => ({ ...prev, about_image_url: mediaItem.public_url }));
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
