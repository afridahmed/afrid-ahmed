import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  Target,
  Sparkles,
  Milestone as MilestoneIcon,
  Flag,
  Calendar,
  Layers,
  Check,
  MoveUp,
  MoveDown
} from 'lucide-react';
import { 
  DbJourneyMilestone, 
  DbJourneyMilestoneInsert,
  getAdminJourneyMilestones, 
  createAdminJourneyMilestone, 
  updateAdminJourneyMilestone, 
  deleteAdminJourneyMilestone, 
  togglePublishAdminJourneyMilestone, 
  setCurrentAdminJourneyMilestone, 
  removeCurrentAdminJourneyMilestone,
  setHorizonAdminJourneyMilestone,
  reorderAdminJourneyMilestones,
  seedDefaultJourneyMilestonesIfEmpty
} from '../../services/journeyService';

export const JourneyEditor: React.FC = () => {
  const [milestones, setMilestones] = useState<DbJourneyMilestone[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMilestone, setEditingMilestone] = useState<DbJourneyMilestone | null>(null);

  // Form fields
  const [formYear, setFormYear] = useState<string>('');
  const [formPhase, setFormPhase] = useState<string>('');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formPillars, setFormPillars] = useState<string[]>([]);
  const [newPillarInput, setNewPillarInput] = useState<string>('');
  const [formIsCurrent, setFormIsCurrent] = useState<boolean>(false);
  const [formIsHorizon, setFormIsHorizon] = useState<boolean>(false);
  const [formIsPublished, setFormIsPublished] = useState<boolean>(true);
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);

  // Delete modal state
  const [deleteCandidate, setDeleteCandidate] = useState<DbJourneyMilestone | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    loadMilestones();
  }, []);

  const loadMilestones = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      // 1. Seed if empty
      await seedDefaultJourneyMilestonesIfEmpty();

      // 2. Fetch all milestones
      const { data, error } = await getAdminJourneyMilestones();
      if (error) {
        setStatusMessage({ type: 'error', text: `Failed to load milestones: ${error}` });
      } else {
        setMilestones(data);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error loading journey milestones' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await seedDefaultJourneyMilestonesIfEmpty();
      if (res.seeded) {
        setStatusMessage({ type: 'success', text: `Successfully seeded ${res.count} canonical milestones into Supabase!` });
        await loadMilestones();
      } else if (res.error) {
        setStatusMessage({ type: 'error', text: `Seed error: ${res.error}` });
      } else {
        setStatusMessage({ type: 'success', text: `Table already contains ${res.count} milestones.` });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Seed failed' });
    } finally {
      setIsSaving(false);
    }
  };

  // Open modal to add a new milestone
  const handleOpenAdd = () => {
    const nextOrder = milestones.length > 0 ? Math.max(...milestones.map(m => m.display_order || 0)) + 1 : 1;
    const latestYear = milestones.length > 0 ? Math.max(...milestones.map(m => parseInt(m.year) || 2026)) + 1 : 2026;

    setEditingMilestone(null);
    setFormYear(latestYear.toString());
    setFormPhase('Advanced Expansion');
    setFormTitle('');
    setFormDescription('');
    setFormPillars([]);
    setNewPillarInput('');
    setFormIsCurrent(milestones.length === 0);
    setFormIsHorizon(false);
    setFormIsPublished(true);
    setFormDisplayOrder(nextOrder);

    setIsModalOpen(true);
  };

  // Open modal to edit an existing milestone
  const handleOpenEdit = (m: DbJourneyMilestone) => {
    setEditingMilestone(m);
    setFormYear(m.year || '');
    setFormPhase(m.phase || '');
    setFormTitle(m.title || '');
    setFormDescription(m.description || '');
    setFormPillars(Array.isArray(m.pillars) ? [...m.pillars] : []);
    setNewPillarInput('');
    setFormIsCurrent(!!m.is_current);
    setFormIsHorizon(!!m.is_horizon);
    setFormIsPublished(!!m.is_published);
    setFormDisplayOrder(m.display_order || 1);

    setIsModalOpen(true);
  };

  // Pillar management helpers
  const handleAddPillar = () => {
    const trimmed = newPillarInput.trim();
    if (!trimmed) return;
    setFormPillars(prev => [...prev, trimmed]);
    setNewPillarInput('');
  };

  const handleDeletePillar = (index: number) => {
    setFormPillars(prev => prev.filter((_, i) => i !== index));
  };

  const handleMovePillar = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formPillars.length) return;
    const copy = [...formPillars];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setFormPillars(copy);
  };

  const handlePillarChange = (index: number, val: string) => {
    const copy = [...formPillars];
    copy[index] = val;
    setFormPillars(copy);
  };

  // Form Submit (Create or Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation: Year (sensible 4-digit year)
    const trimmedYear = formYear.trim();
    if (!trimmedYear || !/^\d{4}$/.test(trimmedYear)) {
      setStatusMessage({ type: 'error', text: 'Year must be a sensible 4-digit number (e.g. 2026, 2030)' });
      return;
    }

    // Validation: Title
    if (!formTitle.trim()) {
      setStatusMessage({ type: 'error', text: 'Milestone title is required' });
      return;
    }

    // Clean pillars: remove empties
    const cleanedPillars = formPillars.map(p => p.trim()).filter(Boolean);

    setIsSaving(true);
    setStatusMessage(null);

    try {
      if (editingMilestone) {
        // UPDATE
        const updatePayload = {
          year: trimmedYear,
          phase: formPhase.trim(),
          title: formTitle.trim(),
          description: formDescription.trim(),
          pillars: cleanedPillars,
          is_current: formIsCurrent,
          is_horizon: formIsHorizon,
          is_published: formIsPublished,
          display_order: Number(formDisplayOrder) || 1,
        };

        const { success, error } = await updateAdminJourneyMilestone(editingMilestone.id, updatePayload);
        if (!success || error) {
          setStatusMessage({ type: 'error', text: error || 'Failed to update journey milestone' });
          setIsSaving(false);
          return;
        }

        setStatusMessage({ type: 'success', text: `Milestone "${trimmedYear} - ${formTitle}" updated successfully!` });
      } else {
        // CREATE
        const insertPayload: DbJourneyMilestoneInsert = {
          year: trimmedYear,
          phase: formPhase.trim(),
          title: formTitle.trim(),
          description: formDescription.trim(),
          pillars: cleanedPillars,
          is_current: formIsCurrent,
          is_horizon: formIsHorizon,
          display_order: Number(formDisplayOrder) || 1,
          is_published: formIsPublished,
        };

        const { data, error } = await createAdminJourneyMilestone(insertPayload);
        if (error || !data) {
          setStatusMessage({ type: 'error', text: error || 'Failed to create journey milestone' });
          setIsSaving(false);
          return;
        }

        setStatusMessage({ type: 'success', text: `Milestone "${trimmedYear} - ${formTitle}" created successfully!` });
      }

      setIsModalOpen(false);
      await loadMilestones();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Operation failed' });
    } finally {
      setIsSaving(false);
    }
  };

  // Reorder milestones up/down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= milestones.length) return;

    const listCopy = [...milestones];
    const [movedItem] = listCopy.splice(index, 1);
    listCopy.splice(targetIndex, 0, movedItem);

    // Re-assign display_order sequentially
    const updatedPayload = listCopy.map((m, idx) => ({
      id: m.id,
      display_order: idx + 1,
    }));

    // Optimistic UI update
    const optimisticMilestones = listCopy.map((m, idx) => ({
      ...m,
      display_order: idx + 1,
    }));
    setMilestones(optimisticMilestones);

    const { success, error } = await reorderAdminJourneyMilestones(updatedPayload);
    if (!success) {
      setStatusMessage({ type: 'error', text: error || 'Failed to save new order' });
      await loadMilestones(); // Rollback
    } else {
      setStatusMessage({ type: 'success', text: 'Journey milestone ordering updated successfully!' });
    }
  };

  // Quick toggle publish/unpublish
  const handleTogglePublish = async (m: DbJourneyMilestone) => {
    const { success, error } = await togglePublishAdminJourneyMilestone(m.id, m.is_published);
    if (!success) {
      setStatusMessage({ type: 'error', text: error || 'Failed to update publication status' });
    } else {
      setMilestones(prev => prev.map(item => item.id === m.id ? { ...item, is_published: !item.is_published } : item));
      setStatusMessage({ 
        type: 'success', 
        text: `Milestone "${m.year}" is now ${!m.is_published ? 'Published' : 'Unpublished'}.` 
      });
    }
  };

  // Quick toggle Current
  const handleToggleCurrent = async (m: DbJourneyMilestone) => {
    if (m.is_current) {
      // Remove current
      const { success, error } = await removeCurrentAdminJourneyMilestone(m.id);
      if (!success) {
        setStatusMessage({ type: 'error', text: error || 'Failed to remove current status' });
      } else {
        setMilestones(prev => prev.map(item => item.id === m.id ? { ...item, is_current: false } : item));
        setStatusMessage({ type: 'success', text: `Current focus status removed from "${m.year}".` });
      }
    } else {
      // Set current (single current rule demotes others)
      const { success, error } = await setCurrentAdminJourneyMilestone(m.id);
      if (!success) {
        setStatusMessage({ type: 'error', text: error || 'Failed to set current milestone' });
      } else {
        setMilestones(prev => prev.map(item => ({
          ...item,
          is_current: item.id === m.id,
        })));
        setStatusMessage({ type: 'success', text: `"${m.year} - ${m.phase}" is now the Current Focus milestone!` });
      }
    }
  };

  // Quick toggle Horizon
  const handleToggleHorizon = async (m: DbJourneyMilestone) => {
    const newStatus = !m.is_horizon;
    const { success, error } = await setHorizonAdminJourneyMilestone(m.id, newStatus);
    if (!success) {
      setStatusMessage({ type: 'error', text: error || 'Failed to update horizon status' });
    } else {
      setMilestones(prev => prev.map(item => item.id === m.id ? { ...item, is_horizon: newStatus } : item));
      setStatusMessage({ 
        type: 'success', 
        text: `Horizon status for "${m.year}" set to ${newStatus ? 'Active' : 'Inactive'}.` 
      });
    }
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);

    try {
      const { success, error } = await deleteAdminJourneyMilestone(deleteCandidate.id);
      if (!success) {
        setStatusMessage({ type: 'error', text: error || 'Failed to delete milestone' });
      } else {
        setStatusMessage({ type: 'success', text: `Milestone "${deleteCandidate.year} - ${deleteCandidate.title}" deleted.` });
        setDeleteCandidate(null);
        await loadMilestones();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error deleting milestone' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono tracking-widest text-[var(--text-secondary)] uppercase font-semibold">
              TRAJECTORY CMS
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-primary)] font-semibold">
              <Compass className="w-3 h-3" />
              PUBLIC.JOURNEY_MILESTONES
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] mt-1">
            Journey & Trajectory Milestones
          </h1>
          <p className="text-sm font-mono text-[var(--text-secondary)] mt-0.5">
            Manage your timeline milestones, active building focus, horizon anchors, and pillars.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={handleSeedDefaults}
            disabled={isLoading || isSaving}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer disabled:opacity-50"
            title="Seed canonical default milestones into database if empty"
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--text-primary)]" />
            <span>SEED DEFAULTS</span>
          </button>

          <button
            onClick={loadMilestones}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] transition-all cursor-pointer disabled:opacity-50"
            title="Refresh from Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--text-primary)] ${isLoading ? 'animate-spin' : ''}`} />
            <span>SYNC</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>ADD MILESTONE</span>
          </button>
        </div>
      </div>

      {/* 2. Status Alert Bar */}
      {statusMessage && (
        <div
          className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-mono text-xs"
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[var(--text-primary)] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[var(--text-primary)] shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="p-1 hover:opacity-75 transition-opacity cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <Loader2 className="w-8 h-8 text-[var(--text-primary)] animate-spin mb-3" />
          <p className="text-sm font-mono text-[var(--text-secondary)]">Loading journey milestones from Supabase...</p>
        </div>
      ) : milestones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] text-center">
          <Compass className="w-12 h-12 text-[var(--text-muted)] mb-3" />
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">No Milestones Found in Database</h3>
          <p className="text-xs font-mono text-[var(--text-secondary)] max-w-md mb-6">
            Add a milestone or sync from the database to manage your trajectory journey.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-solid)] text-[var(--accent-contrast)] text-xs font-mono font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Milestone</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider">
              TOTAL MILESTONES ({milestones.length})
            </span>
            <span className="text-[10px] font-mono text-[var(--text-secondary)]">
              ORDER CONTROLS LIVE TIMELINE SEQUENCE
            </span>
          </div>

          <div className="space-y-3">
            {milestones.map((m, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === milestones.length - 1;

              return (
                <div
                  key={m.id}
                  className={`group rounded-2xl border p-4 sm:p-5 transition-all ${
                    m.is_current 
                      ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-sm' 
                      : m.is_published 
                      ? 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]' 
                      : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] opacity-75'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Left Section: Reordering + Year Orb + Details */}
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                      
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-1 shrink-0 pt-0.5 sm:pt-0">
                        <button
                          onClick={() => handleMoveOrder(idx, 'up')}
                          disabled={isFirst}
                          className="p-1 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(idx, 'down')}
                          disabled={isLast}
                          className="p-1 rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-all cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Year Node Badge */}
                      <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border shrink-0 ${
                        m.is_current 
                          ? 'bg-[var(--accent-solid)] border-[var(--accent-solid)] text-[var(--accent-contrast)]' 
                          : m.is_horizon 
                          ? 'bg-[var(--bg-elevated)] border-[var(--border-strong)] text-[var(--text-primary)]'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)]'
                      }`}>
                        <span className="font-mono text-sm font-extrabold tracking-tight">{m.year}</span>
                        <span className={`text-[9px] font-mono uppercase ${m.is_current ? 'opacity-80' : 'text-[var(--text-muted)]'}`}>#{m.display_order}</span>
                      </div>

                      {/* Milestone Core Meta */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono text-[var(--text-secondary)] font-semibold uppercase tracking-wider">
                            {m.phase || 'Phase'}
                          </span>

                          {m.is_current && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--accent-solid)] text-[var(--accent-contrast)] text-[9px] font-mono font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-contrast)] animate-pulse" />
                              CURRENT FOCUS
                            </span>
                          )}

                          {m.is_horizon && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[9px] font-mono text-[var(--text-primary)] font-bold">
                              <Flag className="w-2.5 h-2.5" />
                              HORIZON ANCHOR
                            </span>
                          )}

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-medium border ${
                              m.is_published
                                ? 'bg-[var(--bg-elevated)] border-[var(--border-strong)] text-[var(--text-primary)]'
                                : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${m.is_published ? 'bg-[var(--text-primary)]' : 'bg-[var(--text-muted)]'}`} />
                            {m.is_published ? 'PUBLISHED' : 'DRAFT'}
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] tracking-tight">
                          {m.title}
                        </h3>

                        {m.description && (
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-1 max-w-2xl font-light">
                            {m.description}
                          </p>
                        )}

                        {Array.isArray(m.pillars) && m.pillars.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {m.pillars.map((pillar, pIdx) => (
                              <span
                                key={pIdx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)]"
                              >
                                <span className="w-1 h-1 rounded-full bg-[var(--text-primary)]" />
                                {pillar}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Right Section: Action Controls */}
                    <div className="flex items-center justify-end gap-2 shrink-0 border-t lg:border-t-0 border-[var(--border-subtle)] pt-3 lg:pt-0">
                      
                      {/* Set / Unset Current */}
                      <button
                        onClick={() => handleToggleCurrent(m)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          m.is_current 
                            ? 'bg-[var(--accent-solid)] border-[var(--accent-solid)] text-[var(--accent-contrast)]' 
                            : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                        title={m.is_current ? 'Remove Current Focus' : 'Set as Current Focus Milestone'}
                      >
                        <Target className="w-4 h-4" />
                      </button>

                      {/* Set / Unset Horizon */}
                      <button
                        onClick={() => handleToggleHorizon(m)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          m.is_horizon 
                            ? 'bg-[var(--accent-solid)] border-[var(--accent-solid)] text-[var(--accent-contrast)]' 
                            : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                        title={m.is_horizon ? 'Remove Horizon Anchor' : 'Set as Horizon Anchor'}
                      >
                        <Flag className="w-4 h-4" />
                      </button>

                      {/* Publish / Unpublish Toggle */}
                      <button
                        onClick={() => handleTogglePublish(m)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer ${
                          m.is_published
                            ? 'bg-[var(--accent-solid)] border-[var(--accent-solid)] text-[var(--accent-contrast)] hover:opacity-90'
                            : 'bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                        title={m.is_published ? 'Unpublish Milestone' : 'Publish Milestone'}
                      >
                        {m.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                        <span>EDIT</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteCandidate(m)}
                        className="p-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--accent-solid)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent-contrast)] transition-all cursor-pointer"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                    </div>

                  </div>
                </div>
              );
            })}

            {milestones.length === 0 && (
              <div className="p-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-center space-y-4">
                <Compass className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">No Journey Milestones in Database</p>
                  <p className="text-xs text-[var(--text-secondary)] font-mono max-w-md mx-auto">
                    The table public.journey_milestones is currently empty. Seed canonical 2026–2030 trajectory milestones to populate both Admin and the public website.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSeedDefaults}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] font-bold text-xs font-mono transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>SEED CANONICAL MILESTONES</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ADD / EDIT MILESTONE MODAL                                             */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    {editingMilestone ? `Edit Milestone: ${editingMilestone.year}` : 'Add New Journey Milestone'}
                  </h2>
                  <p className="text-[11px] font-mono text-[var(--text-secondary)]">
                    Configure timeline year, phase label, description, and target pillars
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-5 overflow-y-auto">
              
              {/* Year & Phase Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-[var(--text-secondary)] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                      Year <span className="text-[var(--text-primary)]">*</span>
                    </label>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      4-digit year (e.g. 2026)
                    </span>
                  </div>
                  <input
                    type="text"
                    pattern="[0-9]{4}"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    placeholder="2026"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                    Phase Label
                  </label>
                  <input
                    type="text"
                    value={formPhase}
                    onChange={(e) => setFormPhase(e.target.value)}
                    placeholder="e.g., Foundation / Going Deeper"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs font-mono"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[var(--text-secondary)]">
                  Milestone Headline / Title <span className="text-[var(--text-primary)]">*</span>
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Core Fundamentals & Active Building"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[var(--text-secondary)]">
                  Milestone Description / Narrative
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Narrative overview of technical goals, research, and milestones for this year..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs font-light leading-relaxed resize-y"
                />
              </div>

              {/* Pillars Editor */}
              <div className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-[var(--text-primary)] uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    KEY TARGET MILESTONES / PILLARS ({formPillars.length})
                  </label>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    Editable list with ordering & removal
                  </span>
                </div>

                {/* Existing Pillars List */}
                <div className="space-y-2">
                  {formPillars.map((pillar, pIdx) => (
                    <div 
                      key={pIdx}
                      className="flex items-center gap-2 p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                    >
                      <span className="text-[11px] font-mono text-[var(--text-primary)] w-5 text-center font-bold">
                        {pIdx + 1}
                      </span>
                      
                      <input
                        type="text"
                        value={pillar}
                        onChange={(e) => handlePillarChange(pIdx, e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] focus:outline-none text-[var(--text-primary)] text-xs"
                      />

                      {/* Move Up */}
                      <button
                        type="button"
                        onClick={() => handleMovePillar(pIdx, 'up')}
                        disabled={pIdx === 0}
                        className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 cursor-pointer"
                        title="Move Pillar Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        onClick={() => handleMovePillar(pIdx, 'down')}
                        disabled={pIdx === formPillars.length - 1}
                        className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-20 cursor-pointer"
                        title="Move Pillar Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeletePillar(pIdx)}
                        className="p-1.5 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--accent-solid)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent-contrast)] cursor-pointer"
                        title="Delete Pillar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add New Pillar Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newPillarInput}
                    onChange={(e) => setNewPillarInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPillar();
                      }
                    }}
                    placeholder="Add a new milestone pillar (e.g., AquaSense X Deployment)..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-dashed border-[var(--border-strong)] focus:border-[var(--accent-solid)] focus:outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddPillar}
                    disabled={!newPillarInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-xs font-mono font-bold text-[var(--accent-contrast)] disabled:opacity-40 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ADD</span>
                  </button>
                </div>
              </div>

              {/* Status Controls */}
              <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
                <span className="text-xs font-mono text-[var(--text-primary)] uppercase tracking-wider block font-semibold">
                  STATUS & DISPLAY CONFIGURATION
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Current Toggle */}
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--border-strong)]">
                    <input
                      type="checkbox"
                      checked={formIsCurrent}
                      onChange={(e) => setFormIsCurrent(e.target.checked)}
                      className="w-4 h-4 rounded accent-[var(--accent-solid)]"
                    />
                    <div>
                      <span className="text-xs font-mono text-[var(--text-primary)] font-bold block">Current Focus</span>
                      <span className="text-[10px] font-mono text-[var(--text-secondary)]">Active build year</span>
                    </div>
                  </label>

                  {/* Horizon Toggle */}
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--border-strong)]">
                    <input
                      type="checkbox"
                      checked={formIsHorizon}
                      onChange={(e) => setFormIsHorizon(e.target.checked)}
                      className="w-4 h-4 rounded accent-[var(--accent-solid)]"
                    />
                    <div>
                      <span className="text-xs font-mono text-[var(--text-primary)] font-bold block">Horizon Anchor</span>
                      <span className="text-[10px] font-mono text-[var(--text-secondary)]">Long-term anchor</span>
                    </div>
                  </label>

                  {/* Published Toggle */}
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--border-strong)]">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded accent-[var(--accent-solid)]"
                    />
                    <div>
                      <span className="text-xs font-mono text-[var(--text-primary)] font-bold block">Published</span>
                      <span className="text-[10px] font-mono text-[var(--text-secondary)]">Visible on live site</span>
                    </div>
                  </label>
                </div>

                {/* Display Order */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-mono text-[var(--text-secondary)]">
                    Display Order Sequence
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(parseInt(e.target.value) || 1)}
                    className="w-32 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] focus:outline-none text-[var(--text-primary)] text-xs font-mono"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-mono font-bold tracking-wide transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>SAVING...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{editingMilestone ? 'UPDATE MILESTONE' : 'ADD MILESTONE'}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[var(--text-primary)]">
              <div className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Confirm Milestone Deletion</h3>
                <span className="text-xs font-mono text-[var(--text-secondary)]">Destructive Database Action</span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to permanently delete milestone{' '}
              <strong className="text-[var(--text-primary)] font-bold">"{deleteCandidate.year} - {deleteCandidate.title}"</strong>?
              This action cannot be undone and will remove it from the timeline.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-mono font-bold tracking-wide transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>DELETING...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>DELETE MILESTONE</span>
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
