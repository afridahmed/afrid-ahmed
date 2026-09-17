import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
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
  Github, 
  ExternalLink, 
  Layers, 
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Copy,
  Hash
} from 'lucide-react';
import { 
  DbProject, 
  DbProjectInsert,
  DEFAULT_DB_PROJECTS, 
  getAdminProjects, 
  createAdminProject, 
  updateAdminProject, 
  deleteAdminProject, 
  togglePublishAdminProject, 
  setFlagshipAdminProject, 
  reorderAdminProjects,
  importCanonicalProjects
} from '../../services/projectService';

// Helper to auto-generate a sensible URL-safe slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export const ProjectsEditor: React.FC = () => {
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProject, setEditingProject] = useState<DbProject | null>(null);
  
  // Form fields
  const [formTitle, setFormTitle] = useState<string>('');
  const [formSubtitle, setFormSubtitle] = useState<string>('');
  const [formTagline, setFormTagline] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formSlug, setFormSlug] = useState<string>('');
  const [formNumber, setFormNumber] = useState<string>('01');
  const [formTechnologies, setFormTechnologies] = useState<string[]>([]);
  const [formHighlights, setFormHighlights] = useState<string[]>([]);
  const [formGithubUrl, setFormGithubUrl] = useState<string>('');
  const [formLiveUrl, setFormLiveUrl] = useState<string>('');
  const [formIsFlagship, setFormIsFlagship] = useState<boolean>(false);
  const [formIsPublished, setFormIsPublished] = useState<boolean>(true);
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState<boolean>(false);

  // New item inputs
  const [newTech, setNewTech] = useState<string>('');
  const [newHighlight, setNewHighlight] = useState<string>('');

  // Delete confirmation modal state
  const [deleteCandidate, setDeleteCandidate] = useState<DbProject | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      // Fetch projects from Supabase source of truth
      const { data, error } = await getAdminProjects();
      if (error) {
        setStatusMessage({ type: 'error', text: `Failed to load projects: ${error}` });
      } else {
        setProjects(data);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error loading projects' });
    } finally {
      setIsLoading(false);
    }
  };

  // Safe deliberate import of canonical static projects
  const handleImportExistingProjects = async () => {
    setIsImporting(true);
    setStatusMessage(null);
    try {
      const result = await importCanonicalProjects();
      if (!result.success) {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Failed to import projects. Please check console for details.',
        });
      } else {
        if (result.count === 0) {
          setStatusMessage({
            type: 'success',
            text: result.details?.[0] || 'All canonical projects already exist in Supabase (0 duplicates added).',
          });
        } else {
          setStatusMessage({
            type: 'success',
            text: `Successfully imported ${result.count} canonical project(s) into Supabase!${result.skippedCount ? ` (${result.skippedCount} already existed and were preserved)` : ''}`,
          });
        }
        await loadProjects();
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Unexpected error importing canonical projects.',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Open modal for new project
  const handleOpenAdd = () => {
    const nextOrder = projects.length > 0 ? Math.max(...projects.map(p => p.display_order || 0)) + 1 : 1;
    const nextNum = String(nextOrder).padStart(2, '0');

    setEditingProject(null);
    setFormTitle('');
    setFormSubtitle('');
    setFormTagline('');
    setFormCategory('Hardware & IoT Engineering');
    setFormDescription('');
    setFormSlug('');
    setFormNumber(nextNum);
    setFormTechnologies(['TypeScript', 'C++']);
    setFormHighlights(['Core system architecture implementation', 'Real-time telemetry and validation']);
    setFormGithubUrl('');
    setFormLiveUrl('');
    setFormIsFlagship(projects.length === 0); // make flagship if first
    setFormIsPublished(true);
    setFormDisplayOrder(nextOrder);
    setSlugManuallyEdited(false);
    setNewTech('');
    setNewHighlight('');

    setIsModalOpen(true);
  };

  // Open modal for editing existing project
  const handleOpenEdit = (proj: DbProject) => {
    setEditingProject(proj);
    setFormTitle(proj.title || '');
    setFormSubtitle(proj.subtitle || '');
    setFormTagline(proj.tagline || '');
    setFormCategory(proj.category || '');
    setFormDescription(proj.description || '');
    setFormSlug(proj.slug || proj.id);
    setFormNumber(proj.number || '01');
    setFormTechnologies(Array.isArray(proj.technologies) ? [...proj.technologies] : []);
    setFormHighlights(Array.isArray(proj.highlights) ? [...proj.highlights] : []);
    setFormGithubUrl(proj.github_url || '');
    setFormLiveUrl(proj.live_url || '');
    setFormIsFlagship(!!proj.is_flagship);
    setFormIsPublished(!!proj.is_published);
    setFormDisplayOrder(proj.display_order || 1);
    setSlugManuallyEdited(true); // Don't auto-overwrite existing slug
    setNewTech('');
    setNewHighlight('');

    setIsModalOpen(true);
  };

  // Auto-slug update when typing title (unless manually modified)
  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!slugManuallyEdited && !editingProject) {
      setFormSlug(generateSlug(val));
    }
  };

  // Handle technology list manipulation
  const handleAddTech = () => {
    if (!newTech.trim()) return;
    if (!formTechnologies.includes(newTech.trim())) {
      setFormTechnologies([...formTechnologies, newTech.trim()]);
    }
    setNewTech('');
  };

  const handleRemoveTech = (index: number) => {
    setFormTechnologies(formTechnologies.filter((_, i) => i !== index));
  };

  const handleMoveTech = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formTechnologies.length) return;
    const copy = [...formTechnologies];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setFormTechnologies(copy);
  };

  // Handle highlight list manipulation
  const handleAddHighlight = () => {
    if (!newHighlight.trim()) return;
    setFormHighlights([...formHighlights, newHighlight.trim()]);
    setNewHighlight('');
  };

  const handleRemoveHighlight = (index: number) => {
    setFormHighlights(formHighlights.filter((_, i) => i !== index));
  };

  const handleMoveHighlight = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formHighlights.length) return;
    const copy = [...formHighlights];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setFormHighlights(copy);
  };

  // Form Submit (Create or Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setStatusMessage({ type: 'error', text: 'Project title is required' });
      return;
    }

    const finalSlug = (formSlug.trim() || generateSlug(formTitle)).toLowerCase();
    if (!finalSlug) {
      setStatusMessage({ type: 'error', text: 'Project slug is required' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      if (editingProject) {
        // UPDATE
        const updatePayload = {
          title: formTitle.trim(),
          subtitle: formSubtitle.trim(),
          tagline: formTagline.trim(),
          category: formCategory.trim(),
          description: formDescription.trim(),
          slug: finalSlug,
          number: formNumber.trim() || '01',
          technologies: formTechnologies,
          highlights: formHighlights,
          github_url: formGithubUrl.trim(),
          live_url: formLiveUrl.trim(),
          is_flagship: formIsFlagship,
          is_published: formIsPublished,
          display_order: Number(formDisplayOrder) || 1,
        };

        const { success, error } = await updateAdminProject(editingProject.id, updatePayload);
        if (!success || error) {
          setStatusMessage({ type: 'error', text: error || 'Failed to update project' });
          setIsSaving(false);
          return;
        }

        setStatusMessage({ type: 'success', text: `Project "${formTitle}" updated successfully!` });
      } else {
        // CREATE
        const newPayload: DbProjectInsert = {
          slug: finalSlug,
          number: formNumber.trim() || '01',
          title: formTitle.trim(),
          subtitle: formSubtitle.trim(),
          tagline: formTagline.trim(),
          category: formCategory.trim(),
          description: formDescription.trim(),
          technologies: formTechnologies,
          highlights: formHighlights,
          github_url: formGithubUrl.trim(),
          live_url: formLiveUrl.trim(),
          is_flagship: formIsFlagship,
          display_order: Number(formDisplayOrder) || 1,
          is_published: formIsPublished,
        };

        const { data, error } = await createAdminProject(newPayload);
        if (error || !data) {
          setStatusMessage({ type: 'error', text: error || 'Failed to create project' });
          setIsSaving(false);
          return;
        }

        setStatusMessage({ type: 'success', text: `Project "${formTitle}" created successfully!` });
      }

      setIsModalOpen(false);
      await loadProjects();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Operation failed' });
    } finally {
      setIsSaving(false);
    }
  };

  // Reordering projects up or down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= projects.length) return;

    const listCopy = [...projects];
    const [movedItem] = listCopy.splice(index, 1);
    listCopy.splice(targetIndex, 0, movedItem);

    // Re-assign display_order sequentially 1, 2, 3...
    const updatedPayload = listCopy.map((p, idx) => ({
      id: p.id,
      display_order: idx + 1,
    }));

    // Optimistic UI update
    const optimisticProjects = listCopy.map((p, idx) => ({
      ...p,
      display_order: idx + 1,
    }));
    setProjects(optimisticProjects);

    const { success, error } = await reorderAdminProjects(updatedPayload);
    if (!success) {
      setStatusMessage({ type: 'error', text: error || 'Failed to save new order' });
      await loadProjects(); // Rollback
    } else {
      setStatusMessage({ type: 'success', text: 'Project ordering updated successfully!' });
    }
  };

  // Quick toggle publish/unpublish
  const handleTogglePublish = async (proj: DbProject) => {
    const { success, error } = await togglePublishAdminProject(proj.id, proj.is_published);
    if (!success) {
      setStatusMessage({ type: 'error', text: error || 'Failed to update publication status' });
    } else {
      setProjects(prev => prev.map(p => p.id === proj.id ? { ...p, is_published: !p.is_published } : p));
      setStatusMessage({ 
        type: 'success', 
        text: `Project "${proj.title}" is now ${!proj.is_published ? 'Published' : 'Unpublished'}.` 
      });
    }
  };

  // Quick set flagship
  const handleSetFlagship = async (proj: DbProject) => {
    if (proj.is_flagship) return; // Already flagship
    const { success, error } = await setFlagshipAdminProject(proj.id);
    if (!success) {
      setStatusMessage({ type: 'error', text: error || 'Failed to set flagship' });
    } else {
      setProjects(prev => prev.map(p => ({
        ...p,
        is_flagship: p.id === proj.id,
      })));
      setStatusMessage({ type: 'success', text: `"${proj.title}" is now the Flagship project!` });
    }
  };

  // Confirmed delete
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);

    try {
      const { success, error } = await deleteAdminProject(deleteCandidate.id);
      if (!success) {
        setStatusMessage({ type: 'error', text: error || 'Failed to delete project' });
      } else {
        setStatusMessage({ type: 'success', text: `Project "${deleteCandidate.title}" deleted.` });
        setDeleteCandidate(null);
        await loadProjects();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error deleting project' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* 1. Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono tracking-widest text-[#38BDF8] uppercase font-semibold">
              PORTFOLIO CMS
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/30 text-[10px] font-mono text-[#38BDF8] font-semibold">
              <FolderKanban className="w-3 h-3" />
              PUBLIC.PROJECTS
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">
            Work & Projects
          </h1>
          <p className="text-sm font-mono text-[#94A3B8] mt-0.5">
            Single source of truth for all projects displayed on the public portfolio.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleImportExistingProjects}
            disabled={isImporting || isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0E131F] hover:bg-[#141B2D] border border-white/10 text-xs font-mono text-[#CBD5E1] transition-all cursor-pointer disabled:opacity-50"
            title="Import or restore canonical projects safely"
          >
            {isImporting ? (
              <Loader2 className="w-3.5 h-3.5 text-[#38BDF8] animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
            )}
            <span>{isImporting ? 'IMPORTING...' : 'IMPORT CANONICAL'}</span>
          </button>

          <button
            onClick={loadProjects}
            disabled={isLoading || isImporting}
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
            <span>ADD PROJECT</span>
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

      {/* 3. Projects List / Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-white/10 bg-[#0E131F]/50 backdrop-blur-md">
          <Loader2 className="w-8 h-8 text-[#38BDF8] animate-spin mb-3" />
          <p className="text-sm font-mono text-[#94A3B8]">Loading projects from Supabase...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-white/15 bg-[#0E131F]/30 text-center">
          <FolderKanban className="w-12 h-12 text-[#38BDF8]/40 mb-3" />
          <h3 className="text-xl font-bold text-white mb-1">Projects</h3>
          <p className="text-xs font-mono text-[#94A3B8] max-w-md mb-6">
            No projects have been added to Supabase yet.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleImportExistingProjects}
              disabled={isImporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#38BDF8] hover:bg-[#60A5FA] text-[#080B11] text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing Projects...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Import Existing Projects</span>
                </>
              )}
            </button>
            <button
              onClick={handleOpenAdd}
              disabled={isImporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] border border-white/10 text-xs font-mono text-[#CBD5E1] transition-all cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project Manually</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((proj, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === projects.length - 1;

            return (
              <div
                key={proj.id}
                className={`group rounded-2xl border p-4 sm:p-5 transition-all backdrop-blur-md ${
                  proj.is_flagship 
                    ? 'border-[#38BDF8]/40 bg-[#0E131F] shadow-[0_0_25px_rgba(56,189,248,0.06)]' 
                    : proj.is_published 
                    ? 'border-white/10 bg-[#0E131F]/80 hover:border-white/20' 
                    : 'border-white/5 bg-[#080B11]/90 opacity-75'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Reorder Controls + Number + Info */}
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-1 shrink-0 pt-0.5 sm:pt-0">
                      <button
                        onClick={() => handleMoveOrder(idx, 'up')}
                        disabled={isFirst}
                        className="p-1 rounded bg-[#141B2D] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white disabled:opacity-20 transition-all cursor-pointer"
                        title="Move Up in Display Order"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(idx, 'down')}
                        disabled={isLast}
                        className="p-1 rounded bg-[#141B2D] hover:bg-[#1E293B] text-[#94A3B8] hover:text-white disabled:opacity-20 transition-all cursor-pointer"
                        title="Move Down in Display Order"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Project Number badge */}
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-[#141B2D] border border-white/10 shrink-0">
                      <span className="font-mono text-sm font-black text-[#38BDF8]">
                        {proj.number || '01'}
                      </span>
                      <span className="text-[9px] font-mono text-[#94A3B8]">
                        #{proj.display_order}
                      </span>
                    </div>

                    {/* Main Project Details */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                          {proj.title}
                        </h3>

                        {/* Status Badges */}
                        {proj.is_flagship && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[10px] font-mono text-[#38BDF8] font-semibold">
                            <Star className="w-2.5 h-2.5 fill-[#38BDF8]" />
                            FLAGSHIP
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                            proj.is_published
                              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                          }`}
                        >
                          {proj.is_published ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              PUBLISHED
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              DRAFT / UNPUBLISHED
                            </>
                          )}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-[#94A3B8]">
                        <span className="text-[#CBD5E1]">{proj.subtitle}</span>
                        <span className="text-white/20">•</span>
                        <span className="text-[#38BDF8]">{proj.category}</span>
                        <span className="text-white/20">•</span>
                        <span className="text-[#64748B]">slug: /{proj.slug}</span>
                      </div>

                      {/* Tech Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {Array.isArray(proj.technologies) &&
                          proj.technologies.slice(0, 5).map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded bg-[#141B2D] border border-white/5 text-[10px] font-mono text-[#CBD5E1]"
                            >
                              {t}
                            </span>
                          ))}
                        {Array.isArray(proj.technologies) && proj.technologies.length > 5 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#94A3B8]">
                            +{proj.technologies.length - 5}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-2 shrink-0 border-t lg:border-t-0 border-white/5 pt-3 lg:pt-0">
                    {/* Make Flagship Button (if not already flagship) */}
                    {!proj.is_flagship && (
                      <button
                        onClick={() => handleSetFlagship(proj)}
                        className="p-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] border border-white/10 text-[#94A3B8] hover:text-[#38BDF8] transition-all cursor-pointer"
                        title="Set as Flagship Project"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}

                    {/* Publish / Unpublish Toggle */}
                    <button
                      onClick={() => handleTogglePublish(proj)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        proj.is_published
                          ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                          : 'bg-[#141B2D] hover:bg-[#1E293B] border-white/10 text-[#94A3B8] hover:text-white'
                      }`}
                      title={proj.is_published ? 'Unpublish Project' : 'Publish Project'}
                    >
                      {proj.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEdit(proj)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] border border-white/10 hover:border-[#38BDF8]/40 text-xs font-mono text-white transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>EDIT</span>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeleteCandidate(proj)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all cursor-pointer"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ADD / EDIT PROJECT MODAL DIALOG                                        */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl my-8 rounded-2xl border border-white/10 bg-[#0E131F] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141B2D]/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#38BDF8]/10 text-[#38BDF8]">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingProject ? `Edit Project: ${editingProject.title}` : 'Add New Project'}
                  </h2>
                  <p className="text-[11px] font-mono text-[#94A3B8]">
                    Configure technical specifications and presentation attributes
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

            {/* Modal Form Body (Scrollable) */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6 overflow-y-auto">
              
              {/* Section 1: Basic Information */}
              <div className="space-y-4">
                <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-wider block font-semibold">
                  1. BASIC INFORMATION
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Title */}
                  <div className="sm:col-span-8 space-y-1.5">
                    <label className="text-xs font-mono text-[#CBD5E1]">
                      Project Title <span className="text-[#38BDF8]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g., AquaSense X"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-sm font-sans"
                    />
                  </div>

                  {/* Number */}
                  <div className="sm:col-span-4 space-y-1.5">
                    <label className="text-xs font-mono text-[#CBD5E1]">
                      Project Number
                    </label>
                    <input
                      type="text"
                      value={formNumber}
                      onChange={(e) => setFormNumber(e.target.value)}
                      placeholder="01"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Subtitle */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-[#CBD5E1]">
                      Subtitle (Short Focus)
                    </label>
                    <input
                      type="text"
                      value={formSubtitle}
                      onChange={(e) => setFormSubtitle(e.target.value)}
                      placeholder="e.g., Embedded Environmental Intelligence"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-sm"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-[#CBD5E1]">
                      Category Badge
                    </label>
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="e.g., Hardware & IoT Engineering"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-sm"
                    />
                  </div>
                </div>

                {/* Tagline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#CBD5E1]">
                    Tagline (Editorial Hook)
                  </label>
                  <input
                    type="text"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    placeholder="e.g., Physical Water Quality Telemetry & Software Diagnostics"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-sm"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-[#CBD5E1]">
                      URL / Visualizer Slug <span className="text-[#38BDF8]">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-[#94A3B8]">
                      Controls interactive visualizer binding
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#64748B]">
                      /projects/
                    </span>
                    <input
                      type="text"
                      value={formSlug}
                      onChange={(e) => {
                        setFormSlug(e.target.value);
                        setSlugManuallyEdited(true);
                      }}
                      placeholder="aquasense-x"
                      required
                      className="w-full pl-24 pr-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-[#38BDF8] text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#CBD5E1]">
                    Detailed Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                    placeholder="Provide a comprehensive technical description of the project architecture and outcomes..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-sm font-sans resize-y"
                  />
                </div>
              </div>

              {/* Section 2: Technical Specifications & Highlights */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-wider block font-semibold">
                  2. TECHNICAL STACK & HIGHLIGHTS
                </span>

                {/* Technologies List Editor */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-[#CBD5E1] block">
                    Technologies / Stack
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTech}
                      onChange={(e) => setNewTech(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTech();
                        }
                      }}
                      placeholder="Add technology (e.g., ESP32-S3, TypeScript, C++)"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddTech}
                      className="px-3.5 py-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] border border-white/10 text-xs font-mono text-[#38BDF8] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {formTechnologies.map((tech, idx) => (
                      <div
                        key={tech + idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141B2D] border border-white/10 text-xs font-mono text-[#CBD5E1]"
                      >
                        <span>{tech}</span>
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            type="button"
                            onClick={() => handleMoveTech(idx, 'up')}
                            disabled={idx === 0}
                            className="text-[#94A3B8] hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveTech(idx, 'down')}
                            disabled={idx === formTechnologies.length - 1}
                            className="text-[#94A3B8] hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTech(idx)}
                            className="text-rose-400 hover:text-rose-300 ml-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {formTechnologies.length === 0 && (
                      <span className="text-xs font-mono text-[#64748B] italic">No technologies added yet.</span>
                    )}
                  </div>
                </div>

                {/* Highlights List Editor */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-mono text-[#CBD5E1] block">
                    Key Highlights / Architectural Takeaways
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newHighlight}
                      onChange={(e) => setNewHighlight(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddHighlight();
                        }
                      }}
                      placeholder="Add highlight point (e.g., Multi-parameter sensor acquisition: Turbidity & TDS)"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddHighlight}
                      className="px-3.5 py-2 rounded-xl bg-[#141B2D] hover:bg-[#1E293B] border border-white/10 text-xs font-mono text-[#38BDF8] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {formHighlights.map((hl, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-[#080B11] border border-white/5 text-xs text-[#CBD5E1]"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="text-[#38BDF8] font-mono shrink-0">0{idx + 1}.</span>
                          <span className="truncate">{hl}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveHighlight(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded text-[#94A3B8] hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveHighlight(idx, 'down')}
                            disabled={idx === formHighlights.length - 1}
                            className="p-1 rounded text-[#94A3B8] hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveHighlight(idx)}
                            className="p-1 rounded text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {formHighlights.length === 0 && (
                      <span className="text-xs font-mono text-[#64748B] italic">No highlights added yet.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Links & URLs */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-wider block font-semibold">
                  3. REPOSITORY & LIVE LINKS
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-[#CBD5E1] flex items-center gap-1.5">
                      <Github className="w-3.5 h-3.5 text-[#38BDF8]" />
                      GitHub Repository URL
                    </label>
                    <input
                      type="url"
                      value={formGithubUrl}
                      onChange={(e) => setFormGithubUrl(e.target.value)}
                      placeholder="https://github.com/afridaskar/..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-[#CBD5E1] flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
                      Live Deployment URL
                    </label>
                    <input
                      type="url"
                      value={formLiveUrl}
                      onChange={(e) => setFormLiveUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 focus:border-[#38BDF8] focus:outline-none text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Publishing & Display Status */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <span className="text-xs font-mono text-[#38BDF8] uppercase tracking-wider block font-semibold">
                  4. PUBLISHING & STATUS
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Flagship Toggle */}
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[#080B11] border border-white/10 cursor-pointer hover:border-white/20">
                    <input
                      type="checkbox"
                      checked={formIsFlagship}
                      onChange={(e) => setFormIsFlagship(e.target.checked)}
                      className="w-4 h-4 rounded text-[#38BDF8] accent-[#38BDF8]"
                    />
                    <div>
                      <span className="text-xs font-mono text-white font-bold block">Flagship Project</span>
                      <span className="text-[10px] font-mono text-[#94A3B8]">Featured highlight</span>
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
                      <span className="text-[10px] font-mono text-[#94A3B8]">Visible on public site</span>
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

              {/* Modal Footer Controls */}
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
                      <span>{editingProject ? 'UPDATE PROJECT' : 'CREATE PROJECT'}</span>
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
                <h3 className="text-base font-bold text-white">Confirm Project Deletion</h3>
                <span className="text-xs font-mono text-rose-400">Destructive Database Action</span>
              </div>
            </div>

            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white font-bold">"{deleteCandidate.title}"</strong> (slug:{' '}
              <span className="text-[#38BDF8] font-mono">/{deleteCandidate.slug}</span>)?
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
                    <span>DELETE PROJECT</span>
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
