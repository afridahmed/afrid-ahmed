import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Save,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Sparkles,
  User,
  GraduationCap,
  Sliders,
  Layers,
  Tag,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Monitor,
  Smartphone,
  X,
  Copy,
  Check,
  Database,
  Globe,
  RotateCcw,
  FileSignature,
  Search,
  Maximize2,
} from 'lucide-react';
import { AboutSection } from '../../components/AboutSection';
import { AboutDynamicIcon, ABOUT_ICON_OPTIONS, AboutIconOption } from '../../data/aboutIcons';
import { MediaLibrary } from './MediaLibrary';
import { DbMediaItem, uploadAdminMedia } from '../../services/mediaService';
import {
  ABOUT_CMS_SQL_SCHEMA,
  AboutCmsDraftPayload,
  DEFAULT_ABOUT_CMS_DRAFT,
  DEFAULT_ABOUT_VISUAL_SETTINGS,
  convertDraftToAboutContent,
  discardAboutDraft,
  generateUuid,
  getAdminAboutCmsState,
  publishAboutCms,
  sanitizeAboutUrl,
  saveAboutDraft,
  unpublishAboutSection,
} from '../../services/aboutCmsService';
import { AboutHighlightItem, AboutInterestItem } from '../../types';

type EditorTab = 'header' | 'portrait' | 'profile' | 'interests' | 'highlights' | 'visual';
type PickerTarget = 'portrait' | 'signature' | null;
type IconPickerContext =
  | { type: 'badge' }
  | { type: 'interest'; id: string }
  | { type: 'highlight'; id: string }
  | { type: 'new-interest' }
  | { type: 'new-highlight' }
  | null;

interface DeleteTarget {
  type: 'interest' | 'highlight';
  id: string;
  title: string;
}

const FOCAL_PRESETS: { label: string; value: string }[] = [
  { label: 'Headshot (Top)', value: '50% 15%' },
  { label: 'Center', value: '50% 50%' },
  { label: 'Lower Frame', value: '50% 80%' },
  { label: 'Left Upper', value: '35% 25%' },
  { label: 'Right Upper', value: '65% 25%' },
];

export const AboutEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<EditorTab>('header');
  const [draft, setDraft] = useState<AboutCmsDraftPayload>(() =>
    JSON.parse(JSON.stringify(DEFAULT_ABOUT_CMS_DRAFT))
  );
  const [publishedSnapshot, setPublishedSnapshot] = useState<AboutCmsDraftPayload | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [hasUnpublishedDraft, setHasUnpublishedDraft] = useState<boolean>(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [schemaNeedsMigration, setSchemaNeedsMigration] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isUnpublishing, setIsUnpublishing] = useState<boolean>(false);
  const [isDiscarding, setIsDiscarding] = useState<boolean>(false);
  const [uploadingTarget, setUploadingTarget] = useState<'portrait' | 'signature' | null>(null);

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Modals & Popovers
  const [mediaPickerTarget, setMediaPickerTarget] = useState<PickerTarget>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [sqlModalOpen, setSqlModalOpen] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const [confirmUnpublishOpen, setConfirmUnpublishOpen] = useState<boolean>(false);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Icon Picker state
  const [iconPickerContext, setIconPickerContext] = useState<IconPickerContext>(null);
  const [iconSearch, setIconSearch] = useState<string>('');
  const [iconCategory, setIconCategory] = useState<'All' | AboutIconOption['category']>('All');

  // New item creation state
  const [newInterestOpen, setNewInterestOpen] = useState<boolean>(false);
  const [newInterestForm, setNewInterestForm] = useState<{
    title: string;
    iconName: string;
    description: string;
  }>({ title: '', iconName: 'Sparkles', description: '' });

  const [newHighlightOpen, setNewHighlightOpen] = useState<boolean>(false);
  const [newHighlightForm, setNewHighlightForm] = useState<{
    title: string;
    supportingText: string;
    iconName: string;
    description: string;
  }>({ title: '', supportingText: '', iconName: 'Terminal', description: '' });

  // Drag-and-drop state
  const [draggedInterestIdx, setDraggedInterestIdx] = useState<number | null>(null);
  const [draggedHighlightIdx, setDraggedHighlightIdx] = useState<number | null>(null);

  // Direct file upload refs
  const portraitFileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    return JSON.stringify(draft) !== savedSnapshot;
  }, [draft, savedSnapshot]);

  // Warn on tab close/reload if local edits exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const loadState = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const { data, error } = await getAdminAboutCmsState();
      setDraft(data.draft);
      setPublishedSnapshot(data.published);
      setSavedSnapshot(JSON.stringify(data.draft));
      setIsPublished(data.isPublished);
      setHasUnpublishedDraft(data.hasUnpublishedChanges);
      setPublishedAt(data.publishedAt);
      setSchemaNeedsMigration(data.schemaNeedsMigration);
      if (error) {
        setStatusMessage({ type: 'error', text: error });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Unable to load About section CMS data.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  // Validation helper before Save Draft / Publish
  const validateDraft = (payload: AboutCmsDraftPayload): string | null => {
    if (!payload.header.heading.trim()) {
      return 'Section Header: Main Heading cannot be empty.';
    }
    if (!payload.profileCard.fullName.trim()) {
      return 'Profile Card: Full Name cannot be empty.';
    }
    if (!payload.profileCard.introduction.trim()) {
      return 'Profile Card: Introduction paragraph cannot be empty.';
    }
    const invalidInterest = payload.interests.find((i) => !i.title.trim());
    if (invalidInterest) {
      return 'Interests: Every interest tag must have a non-empty title.';
    }
    const invalidHighlight = payload.highlights.find((h) => !h.title.trim());
    if (invalidHighlight) {
      return 'Highlights: Every highlight item must have a non-empty title.';
    }
    return null;
  };

  const handleSaveDraft = async () => {
    const validationError = validateDraft(draft);
    if (validationError) {
      setStatusMessage({ type: 'error', text: validationError });
      return;
    }

    setIsSavingDraft(true);
    setStatusMessage(null);
    try {
      const res = await saveAboutDraft(draft);
      if (!res.success) {
        if (res.schemaNeedsMigration) {
          setSchemaNeedsMigration(true);
          setSqlModalOpen(true);
        }
        setStatusMessage({ type: 'error', text: res.error || 'Failed to save draft.' });
      } else {
        setSavedSnapshot(JSON.stringify(draft));
        setHasUnpublishedDraft(true);
        setStatusMessage({
          type: 'success',
          text: 'Draft saved privately. Live portfolio remains unchanged until you publish.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to save draft.' });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handlePublish = async () => {
    const validationError = validateDraft(draft);
    if (validationError) {
      setStatusMessage({ type: 'error', text: validationError });
      return;
    }

    setIsPublishing(true);
    setStatusMessage(null);
    try {
      const res = await publishAboutCms(draft);
      if (!res.success) {
        if (res.schemaNeedsMigration) {
          setSchemaNeedsMigration(true);
          setSqlModalOpen(true);
        }
        setStatusMessage({ type: 'error', text: res.error || 'Failed to publish changes.' });
      } else {
        const now = new Date().toISOString();
        setIsPublished(true);
        setHasUnpublishedDraft(false);
        setPublishedAt(now);
        const { data: refreshed, error: refreshErr } = await getAdminAboutCmsState();
        setDraft(refreshed.draft);
        setPublishedSnapshot(refreshed.published);
        setSavedSnapshot(JSON.stringify(refreshed.draft));
        setSchemaNeedsMigration(refreshed.schemaNeedsMigration);
        setStatusMessage({
          type: refreshErr ? 'info' : 'success',
          text: refreshErr
            ? `About section published live, though reloading refreshed metadata returned a warning: ${refreshErr}`
            : 'About section published live cleanly in an atomic update.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Publish failed.' });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsUnpublishing(true);
    setStatusMessage(null);
    try {
      const res = await unpublishAboutSection();
      if (!res.success) {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to unpublish section.' });
      } else {
        setIsPublished(false);
        setConfirmUnpublishOpen(false);
        setStatusMessage({
          type: 'info',
          text: 'About section is now unpublished and hidden from public visitors.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Unpublish failed.' });
    } finally {
      setIsUnpublishing(false);
    }
  };

  const handleDiscardDraft = async () => {
    setIsDiscarding(true);
    setStatusMessage(null);
    const baseline: AboutCmsDraftPayload = JSON.parse(
      JSON.stringify(publishedSnapshot || DEFAULT_ABOUT_CMS_DRAFT)
    );
    try {
      const res = await discardAboutDraft(baseline);
      if (!res.success) {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to discard draft.' });
      } else {
        setDraft(baseline);
        setSavedSnapshot(JSON.stringify(baseline));
        setHasUnpublishedDraft(false);
        setConfirmDiscardOpen(false);
        setStatusMessage({
          type: 'info',
          text: 'Draft discarded. Editor restored to live published content.',
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Discard draft failed.' });
    } finally {
      setIsDiscarding(false);
    }
  };

  // Direct Storage Upload Handler (Portrait or Signature)
  const handleDirectImageUpload = async (
    target: 'portrait' | 'signature',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingTarget(target);
    setStatusMessage(null);
    try {
      const defaultAlt =
        target === 'portrait'
          ? draft.portrait.altText || 'Afrid Ahmed portrait'
          : `${draft.profileCard.fullName} ${draft.profileCard.nameAccent} signature`.trim();
      const { data, error } = await uploadAdminMedia(file, {
        folder: 'about',
        altText: defaultAlt,
      });

      if (error || !data) {
        setStatusMessage({
          type: 'error',
          text: error || 'Image upload failed. Verify Supabase storage policies.',
        });
      } else {
        if (target === 'portrait') {
          setDraft((prev) => ({
            ...prev,
            portrait: {
              ...prev.portrait,
              imageUrl: data.public_url,
              altText: prev.portrait.altText || data.alt_text || 'Afrid Ahmed',
            },
          }));
        } else {
          setDraft((prev) => ({
            ...prev,
            profileCard: {
              ...prev.profileCard,
              signatureImageUrl: data.public_url,
            },
          }));
        }
        setStatusMessage({
          type: 'success',
          text: `${target === 'portrait' ? 'Portrait' : 'Signature'} uploaded to Supabase Storage. Save Draft or Publish to persist.`,
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Upload error occurred.' });
    } finally {
      setUploadingTarget(null);
    }
  };

  const handleSelectFromMediaLibrary = (item: DbMediaItem) => {
    if (mediaPickerTarget === 'portrait') {
      setDraft((prev) => ({
        ...prev,
        portrait: {
          ...prev.portrait,
          imageUrl: item.public_url,
          altText: item.alt_text || prev.portrait.altText || 'Afrid Ahmed',
        },
      }));
    } else if (mediaPickerTarget === 'signature') {
      setDraft((prev) => ({
        ...prev,
        profileCard: {
          ...prev.profileCard,
          signatureImageUrl: item.public_url,
        },
      }));
    }
    setMediaPickerTarget(null);
  };

  // =========================================================================
  // INTERESTS CRUD & REORDERING
  // =========================================================================

  const handleAddInterest = () => {
    if (!newInterestForm.title.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a title for the new interest.' });
      return;
    }
    const newItem: AboutInterestItem = {
      id: generateUuid(),
      title: newInterestForm.title.trim(),
      iconName: newInterestForm.iconName || 'Sparkles',
      description: newInterestForm.description.trim(),
      displayOrder: draft.interests.length + 1,
      isVisible: true,
    };
    setDraft((prev) => ({
      ...prev,
      interests: [...prev.interests, newItem],
    }));
    setNewInterestForm({ title: '', iconName: 'Sparkles', description: '' });
    setNewInterestOpen(false);
  };

  const updateInterest = (id: string, patch: Partial<AboutInterestItem>) => {
    setDraft((prev) => ({
      ...prev,
      interests: prev.interests.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const moveInterest = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= draft.interests.length) return;
    setDraft((prev) => {
      const next = [...prev.interests];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return {
        ...prev,
        interests: next.map((item, idx) => ({ ...item, displayOrder: idx + 1 })),
      };
    });
  };

  const handleInterestDrop = (dropIndex: number) => {
    if (draggedInterestIdx === null || draggedInterestIdx === dropIndex) {
      setDraggedInterestIdx(null);
      return;
    }
    setDraft((prev) => {
      const next = [...prev.interests];
      const [moved] = next.splice(draggedInterestIdx, 1);
      next.splice(dropIndex, 0, moved);
      return {
        ...prev,
        interests: next.map((item, idx) => ({ ...item, displayOrder: idx + 1 })),
      };
    });
    setDraggedInterestIdx(null);
  };

  // =========================================================================
  // HIGHLIGHTS CRUD & REORDERING
  // =========================================================================

  const handleAddHighlight = () => {
    if (!newHighlightForm.title.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a title for the new highlight.' });
      return;
    }
    const newItem: AboutHighlightItem = {
      id: generateUuid(),
      title: newHighlightForm.title.trim(),
      supportingText: newHighlightForm.supportingText.trim(),
      iconName: newHighlightForm.iconName || 'Terminal',
      description: newHighlightForm.description.trim(),
      displayOrder: draft.highlights.length + 1,
      isVisible: true,
    };
    setDraft((prev) => ({
      ...prev,
      highlights: [...prev.highlights, newItem],
    }));
    setNewHighlightForm({ title: '', supportingText: '', iconName: 'Terminal', description: '' });
    setNewHighlightOpen(false);
  };

  const updateHighlight = (id: string, patch: Partial<AboutHighlightItem>) => {
    setDraft((prev) => ({
      ...prev,
      highlights: prev.highlights.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const moveHighlight = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= draft.highlights.length) return;
    setDraft((prev) => {
      const next = [...prev.highlights];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return {
        ...prev,
        highlights: next.map((item, idx) => ({ ...item, displayOrder: idx + 1 })),
      };
    });
  };

  const handleHighlightDrop = (dropIndex: number) => {
    if (draggedHighlightIdx === null || draggedHighlightIdx === dropIndex) {
      setDraggedHighlightIdx(null);
      return;
    }
    setDraft((prev) => {
      const next = [...prev.highlights];
      const [moved] = next.splice(draggedHighlightIdx, 1);
      next.splice(dropIndex, 0, moved);
      return {
        ...prev,
        highlights: next.map((item, idx) => ({ ...item, displayOrder: idx + 1 })),
      };
    });
    setDraggedHighlightIdx(null);
  };

  const handleConfirmDeleteItem = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'interest') {
      setDraft((prev) => ({
        ...prev,
        interests: prev.interests
          .filter((i) => i.id !== deleteTarget.id)
          .map((item, idx) => ({ ...item, displayOrder: idx + 1 })),
      }));
    } else {
      setDraft((prev) => ({
        ...prev,
        highlights: prev.highlights
          .filter((h) => h.id !== deleteTarget.id)
          .map((item, idx) => ({ ...item, displayOrder: idx + 1 })),
      }));
    }
    setDeleteTarget(null);
  };

  // =========================================================================
  // ICON PICKER SELECTION HANDLER
  // =========================================================================

  const handleSelectIcon = (iconName: string) => {
    if (!iconPickerContext) return;
    if (iconPickerContext.type === 'badge') {
      setDraft((prev) => ({
        ...prev,
        educationBadge: { ...prev.educationBadge, iconName },
      }));
    } else if (iconPickerContext.type === 'interest') {
      updateInterest(iconPickerContext.id, { iconName });
    } else if (iconPickerContext.type === 'highlight') {
      updateHighlight(iconPickerContext.id, { iconName });
    } else if (iconPickerContext.type === 'new-interest') {
      setNewInterestForm((prev) => ({ ...prev, iconName }));
    } else if (iconPickerContext.type === 'new-highlight') {
      setNewHighlightForm((prev) => ({ ...prev, iconName }));
    }
    setIconPickerContext(null);
    setIconSearch('');
  };

  const filteredIcons = useMemo(() => {
    return ABOUT_ICON_OPTIONS.filter((opt) => {
      const matchesCat = iconCategory === 'All' || opt.category === iconCategory;
      const matchesSearch =
        !iconSearch.trim() ||
        opt.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
        opt.name.toLowerCase().includes(iconSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [iconCategory, iconSearch]);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(ABOUT_CMS_SQL_SCHEMA);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      setStatusMessage({
        type: 'info',
        text: 'Select and copy the SQL script manually from the modal.',
      });
    }
  };

  const tabs: { id: EditorTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'header', label: 'Section Header', icon: Sparkles },
    { id: 'portrait', label: 'Portrait & Badge', icon: ImageIcon },
    { id: 'profile', label: 'Profile & Signature', icon: User },
    { id: 'interests', label: 'Interests', icon: Tag, count: draft.interests.length },
    { id: 'highlights', label: 'Highlights', icon: Layers, count: draft.highlights.length },
    { id: 'visual', label: 'Visual Settings', icon: Sliders },
  ];

  const previewAboutContent = useMemo(
    () => convertDraftToAboutContent(draft, true),
    [draft]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[var(--text-secondary)] font-mono text-xs gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-primary)]" />
        <span>Loading About Section CMS state from Supabase...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6 pb-16">
      {/* Hidden Direct Upload Inputs */}
      <input
        ref={portraitFileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={(e) => handleDirectImageUpload('portrait', e)}
        className="hidden"
      />
      <input
        ref={signatureFileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={(e) => handleDirectImageUpload('signature', e)}
        className="hidden"
      />

      {/* =================================================================== */}
      {/* 1. TOP COMMAND BAR: STATUS + PREVIEW + DRAFT / PUBLISH CONTROLS     */}
      {/* =================================================================== */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] backdrop-blur-md p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono tracking-widest text-[var(--text-secondary)] uppercase font-semibold">
                ABOUT SECTION CMS
              </span>
              {isPublished ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[10px] font-mono text-[var(--text-primary)] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-solid)]" />
                  PUBLISHED LIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                  UNPUBLISHED (HIDDEN)
                </span>
              )}

              {(isDirty || hasUnpublishedDraft) && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[10px] font-mono text-[var(--text-primary)] font-semibold">
                  {isDirty ? 'UNSAVED LOCAL EDITS' : 'DRAFT PENDING PUBLISH'}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight mt-1">
              About Me Layout & Content Manager
            </h1>
            <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
              Edit every block, portrait setting, education badge, signature, interest, highlight, and visibility rule.
              {publishedAt && (
                <span className="ml-2 text-[var(--text-muted)]">
                  Last published: {new Date(publishedAt).toLocaleString()}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={loadState}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Reload from Supabase"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[var(--text-primary)]" />
              <span>Sync</span>
            </button>

            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-strong)] text-xs font-mono font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Draft</span>
            </button>

            {(hasUnpublishedDraft || isDirty) && (
              <button
                type="button"
                onClick={() => setConfirmDiscardOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Discard Draft</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft || isPublishing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-strong)] text-xs font-mono font-semibold text-[var(--text-primary)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSavingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-primary)]" /> : <Save className="w-3.5 h-3.5 text-[var(--text-primary)]" />}
              <span>{isSavingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
            </button>

            {isPublished ? (
              <button
                type="button"
                onClick={() => setConfirmUnpublishOpen(true)}
                disabled={isUnpublishing}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Unpublish</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing || isSavingDraft}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-mono font-bold tracking-wide transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              <span>{isPublishing ? 'Publishing...' : isPublished ? 'Publish Changes' : 'Publish Live'}</span>
            </button>
          </div>
        </div>

        {/* Schema Migration Warning Banner (if tables/columns are not yet migrated) */}
        {schemaNeedsMigration && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)]">
            <div className="flex items-start gap-2.5">
              <Database className="w-4 h-4 text-[var(--text-primary)] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--text-primary)]">Database Schema Upgrade Needed: </span>
                <span className="text-[var(--text-secondary)]">
                  Run the non-destructive About CMS SQL migration in your Supabase SQL Editor so drafts, normalized interests, highlights, and visual settings persist cleanly.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSqlModalOpen(true)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--accent-solid)] text-[var(--accent-contrast)] font-bold hover:opacity-90 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>View Migration SQL</span>
            </button>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div
            className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)] text-xs font-mono"
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--text-primary)]" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-[var(--text-primary)]" />
              )}
              <span>{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              aria-label="Dismiss message"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 2. SECTION TABS NAVIGATION                                          */}
      {/* =================================================================== */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[var(--accent-solid)] text-[var(--accent-contrast)] border-[var(--accent-solid)] font-bold shadow-sm'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      isActive
                        ? 'bg-[var(--accent-contrast)]/15 text-[var(--accent-contrast)]'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setSqlModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[11px] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <Database className="w-3.5 h-3.5" />
          <span>SQL Schema</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 3. ACTIVE TAB PANELS                                                */}
      {/* =================================================================== */}

      {/* TAB A: SECTION HEADER */}
      {activeTab === 'header' && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">A. Section Header Controls</h2>
              <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                Configure the eyebrow label, main heading, accent word, subtitle, and optional divider.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono text-[var(--text-secondary)]">
                Section Eyebrow Label
              </label>
              <input
                type="text"
                value={draft.header.sectionLabel}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    header: { ...prev.header, sectionLabel: e.target.value },
                  }))
                }
                placeholder="THE PERSON BEHIND THE CODE"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-[var(--text-secondary)]">
                Main Heading Text <span className="text-[var(--text-primary)]">*</span>
              </label>
              <input
                type="text"
                value={draft.header.heading}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    header: { ...prev.header, heading: e.target.value },
                  }))
                }
                placeholder="ABOUT"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-[var(--text-secondary)]">
                Accent Gradient Word
              </label>
              <input
                type="text"
                value={draft.header.headingAccent}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    header: { ...prev.header, headingAccent: e.target.value },
                  }))
                }
                placeholder="ME"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-xs font-mono text-[var(--text-secondary)]">
                Subtitle / Tagline
              </label>
              <input
                type="text"
                value={draft.header.subtitle}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    header: { ...prev.header, subtitle: e.target.value },
                  }))
                }
                placeholder="Curious by default. Building by choice."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div>
              <div className="text-xs font-mono font-semibold text-[var(--text-primary)]">
                Decorative Accent Divider
              </div>
              <div className="text-[11px] font-mono text-[var(--text-secondary)]">
                Displays a subtle horizontal accent line centered below the header subtitle.
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  header: { ...prev.header, showDivider: !prev.header.showDivider },
                  visualSettings: {
                    ...prev.visualSettings,
                    showSectionDivider: !prev.header.showDivider,
                  },
                }))
              }
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-colors cursor-pointer ${
                draft.header.showDivider
                  ? 'bg-[var(--accent-solid)] text-[var(--accent-contrast)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
              }`}
            >
              {draft.header.showDivider ? 'VISIBLE' : 'HIDDEN'}
            </button>
          </div>
        </div>
      )}

      {/* TAB B: PORTRAIT & FLOATING EDUCATION BADGE */}
      {activeTab === 'portrait' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Portrait Controls */}
          <div className="lg:col-span-7 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">B. Profile Portrait</h2>
                <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                  Upload or pick from Supabase Media Library, tune focal crop, fit, and scale.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Live Circular Portrait Preview */}
              <div className="relative w-40 h-40 shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-[var(--border-strong)] bg-[var(--bg-canvas)] flex items-center justify-center shadow-lg">
                  {sanitizeAboutUrl(draft.portrait.imageUrl) ? (
                    <img
                      src={sanitizeAboutUrl(draft.portrait.imageUrl)}
                      alt={draft.portrait.altText || 'Portrait preview'}
                      className={`w-full h-full ${
                        draft.portrait.fit === 'contain' ? 'object-contain' : 'object-cover'
                      }`}
                      style={{
                        objectPosition: draft.portrait.focalPoint || '50% 15%',
                        transform: `scale(${draft.portrait.scale || 1})`,
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center text-[var(--text-muted)] font-mono text-[11px] gap-1">
                      <User className="w-8 h-8" />
                      <span>No Photo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload / Replace / Remove Controls */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => portraitFileInputRef.current?.click()}
                    disabled={uploadingTarget === 'portrait'}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
                  >
                    {uploadingTarget === 'portrait' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{draft.portrait.imageUrl ? 'Upload Replacement' : 'Upload Portrait'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMediaPickerTarget('portrait')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                    <span>Browse Media Library</span>
                  </button>

                  {draft.portrait.imageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          portrait: { ...prev.portrait, imageUrl: '' },
                        }))
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--accent-solid)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--accent-contrast)] cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-[var(--text-secondary)]">
                    Image URL (Auto-populated on upload)
                  </label>
                  <input
                    type="text"
                    value={draft.portrait.imageUrl}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        portrait: { ...prev.portrait, imageUrl: e.target.value },
                      }))
                    }
                    placeholder="/images/afrid-about.jpg or https://..."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-[var(--text-secondary)]">
                    Portrait Alt Text (Accessibility & SEO)
                  </label>
                  <input
                    type="text"
                    value={draft.portrait.altText}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        portrait: { ...prev.portrait, altText: e.target.value },
                      }))
                    }
                    placeholder="Afrid Ahmed"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Portrait Framing Controls: Focal Point, Fit, Scale */}
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-mono text-[var(--text-secondary)]">Object Fit</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['cover', 'contain'] as const).map((fitOpt) => (
                      <button
                        key={fitOpt}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            portrait: { ...prev.portrait, fit: fitOpt },
                            visualSettings: { ...prev.visualSettings, portraitFit: fitOpt },
                          }))
                        }
                        className={`py-2 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer uppercase ${
                          draft.portrait.fit === fitOpt
                            ? 'bg-[var(--accent-solid)] border-[var(--accent-solid)] text-[var(--accent-contrast)]'
                            : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {fitOpt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-[var(--text-secondary)]">
                      Portrait Scale ({draft.portrait.scale.toFixed(2)}x)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          portrait: { ...prev.portrait, scale: 1 },
                          visualSettings: { ...prev.visualSettings, portraitScale: 1 },
                        }))
                      }
                      className="text-[10px] font-mono text-[var(--text-primary)] hover:underline cursor-pointer"
                    >
                      Reset 1.00x
                    </button>
                  </div>
                  <input
                    type="range"
                    min={0.85}
                    max={1.15}
                    step={0.01}
                    value={draft.portrait.scale}
                    onChange={(e) => {
                      const scale = parseFloat(e.target.value);
                      setDraft((prev) => ({
                        ...prev,
                        portrait: { ...prev.portrait, scale },
                        visualSettings: { ...prev.visualSettings, portraitScale: scale },
                      }));
                    }}
                    className="w-full accent-[var(--accent-solid)] cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono text-[var(--text-secondary)]">
                  Focal Point / Framing Preset
                </label>
                <div className="flex flex-wrap gap-2">
                  {FOCAL_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          portrait: { ...prev.portrait, focalPoint: preset.value },
                          visualSettings: {
                            ...prev.visualSettings,
                            portraitPosition: preset.value,
                          },
                        }))
                      }
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer ${
                        draft.portrait.focalPoint === preset.value
                          ? 'bg-[var(--accent-solid)] border-[var(--accent-solid)] text-[var(--accent-contrast)] font-semibold'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={draft.portrait.focalPoint}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      portrait: { ...prev.portrait, focalPoint: e.target.value },
                      visualSettings: {
                        ...prev.visualSettings,
                        portraitPosition: e.target.value,
                      },
                    }))
                  }
                  placeholder="50% 15%"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Education Floating Badge Controls */}
          <div className="lg:col-span-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">C. Floating Education Badge</h2>
                <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                  Pill badge anchored beneath the portrait orb.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    visualSettings: {
                      ...prev.visualSettings,
                      showEducationBadge: !prev.visualSettings.showEducationBadge,
                    },
                  }))
                }
                className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold cursor-pointer border ${
                  draft.visualSettings.showEducationBadge
                    ? 'bg-[var(--accent-solid)] text-[var(--accent-contrast)] border-[var(--accent-solid)]'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                }`}
              >
                {draft.visualSettings.showEducationBadge ? 'VISIBLE' : 'HIDDEN'}
              </button>
            </div>

            {/* Badge Live Mini Preview */}
            <div className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex flex-col items-center justify-center min-h-[82px]">
              <div className="flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-1.5 shadow-sm">
                <AboutDynamicIcon
                  name={draft.educationBadge.iconName}
                  fallback={GraduationCap}
                  className="w-3.5 h-3.5 text-[var(--text-primary)]"
                />
                <span className="font-bold text-xs text-[var(--text-primary)]">
                  {[draft.educationBadge.institution, draft.educationBadge.program]
                    .filter(Boolean)
                    .join(' ') || 'Badge'}
                </span>
                {draft.educationBadge.graduationYear && (
                  <>
                    <span className="text-[var(--text-muted)] text-xs">/</span>
                    <span className="font-mono text-[11px] text-[var(--text-secondary)]">
                      {draft.educationBadge.graduationYear}
                    </span>
                  </>
                )}
              </div>
              {draft.educationBadge.supportingText && (
                <span className="mt-1.5 text-[10px] font-mono text-[var(--text-secondary)]">
                  {draft.educationBadge.supportingText}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-[var(--text-secondary)]">Institution</label>
                  <input
                    type="text"
                    value={draft.educationBadge.institution}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        educationBadge: { ...prev.educationBadge, institution: e.target.value },
                      }))
                    }
                    placeholder="SLIIT"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-mono text-[var(--text-secondary)]">Program Tag</label>
                  <input
                    type="text"
                    value={draft.educationBadge.program}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        educationBadge: { ...prev.educationBadge, program: e.target.value },
                      }))
                    }
                    placeholder="CS"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--text-secondary)]">
                  Graduation / Class Year
                </label>
                <input
                  type="text"
                  value={draft.educationBadge.graduationYear}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      educationBadge: { ...prev.educationBadge, graduationYear: e.target.value },
                    }))
                  }
                  placeholder="Class of 2030"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--text-secondary)]">
                  Optional Supporting Caption
                </label>
                <input
                  type="text"
                  value={draft.educationBadge.supportingText || ''}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      educationBadge: { ...prev.educationBadge, supportingText: e.target.value },
                    }))
                  }
                  placeholder="Leave blank for clean pill style"
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--text-secondary)]">Badge Icon</label>
                <button
                  type="button"
                  onClick={() => setIconPickerContext({ type: 'badge' })}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <AboutDynamicIcon
                      name={draft.educationBadge.iconName}
                      fallback={GraduationCap}
                      className="w-4 h-4 text-[var(--text-primary)]"
                    />
                    <span>{draft.educationBadge.iconName || 'GraduationCap'}</span>
                  </span>
                  <span className="text-[var(--text-secondary)] text-[11px]">Change Icon</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB C: PROFILE CARD & SIGNATURE */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5">
            <div className="border-b border-[var(--border-subtle)] pb-4">
              <h2 className="text-base font-bold text-[var(--text-primary)]">D. Profile Information Card</h2>
              <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                Controls name typography, academic credentials line, and authentic introduction copy.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--text-secondary)]">
                  Primary Name <span className="text-[var(--text-primary)]">*</span>
                </label>
                <input
                  type="text"
                  value={draft.profileCard.fullName}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      profileCard: { ...prev.profileCard, fullName: e.target.value },
                    }))
                  }
                  placeholder="Afrid"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--text-secondary)]">
                  Accent Name (Gradient)
                </label>
                <input
                  type="text"
                  value={draft.profileCard.nameAccent}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      profileCard: { ...prev.profileCard, nameAccent: e.target.value },
                    }))
                  }
                  placeholder="Ahmed"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--text-secondary)]">Academic Role</label>
                <input
                  type="text"
                  value={draft.profileCard.academicRole}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      profileCard: { ...prev.profileCard, academicRole: e.target.value },
                    }))
                  }
                  placeholder="SLIIT Undergraduate"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[var(--text-secondary)]">Institution</label>
                <input
                  type="text"
                  value={draft.profileCard.institution}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      profileCard: { ...prev.profileCard, institution: e.target.value },
                    }))
                  }
                  placeholder="SLIIT"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-mono text-[var(--text-secondary)]">
                  Degree / Program Title
                </label>
                <input
                  type="text"
                  value={draft.profileCard.degreeProgram}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      profileCard: { ...prev.profileCard, degreeProgram: e.target.value },
                    }))
                  }
                  placeholder="BSc (Hons) in Computer Science"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono text-[var(--text-secondary)]">
                    Introduction Paragraph <span className="text-[var(--text-primary)]">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                    {draft.profileCard.introduction.length} chars
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={draft.profileCard.introduction}
                  onChange={(e) =>
                    setDraft((prev) => ({
                      ...prev,
                      profileCard: { ...prev.profileCard, introduction: e.target.value },
                    }))
                  }
                  placeholder="Authentic builder introduction..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] leading-relaxed focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Signature Image Upload & Controls */}
          <div className="lg:col-span-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-[var(--text-primary)]" />
                  <span>Signature Graphic</span>
                </h2>
                <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                  Optional transparent PNG/WebP displayed top-right on the glass card.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    visualSettings: {
                      ...prev.visualSettings,
                      showSignature: !prev.visualSettings.showSignature,
                    },
                  }))
                }
                className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold cursor-pointer border ${
                  draft.visualSettings.showSignature
                    ? 'bg-[var(--accent-solid)] text-[var(--accent-contrast)] border-[var(--accent-solid)]'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)]'
                }`}
              >
                {draft.visualSettings.showSignature ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            {/* Dark Card Backdrop Preview */}
            <div className="h-36 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] flex flex-col items-center justify-center p-4">
              {sanitizeAboutUrl(draft.profileCard.signatureImageUrl) ? (
                <img
                  src={sanitizeAboutUrl(draft.profileCard.signatureImageUrl)}
                  alt="Signature preview"
                  className="max-h-20 max-w-full object-contain"
                />
              ) : (
                <div className="text-center space-y-1">
                  <FileSignature className="w-7 h-7 text-[var(--text-muted)] mx-auto" />
                  <p className="text-xs font-mono text-[var(--text-muted)]">
                    No signature uploaded (area cleanly omitted on card)
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => signatureFileInputRef.current?.click()}
                disabled={uploadingTarget === 'signature'}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
              >
                {uploadingTarget === 'signature' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>
                  {draft.profileCard.signatureImageUrl ? 'Replace Signature' : 'Upload Signature'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMediaPickerTarget('signature')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                <span>Media Library</span>
              </button>

              {draft.profileCard.signatureImageUrl && (
                <button
                  type="button"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      profileCard: { ...prev.profileCard, signatureImageUrl: '' },
                    }))
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--accent-solid)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--accent-contrast)] cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-[var(--text-secondary)]">
                Signature Image URL
              </label>
              <input
                type="text"
                value={draft.profileCard.signatureImageUrl || ''}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    profileCard: { ...prev.profileCard, signatureImageUrl: e.target.value },
                  }))
                }
                placeholder="https://... (leave empty to hide)"
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB D: AREAS OF INTEREST (DYNAMIC CRUD + REORDERING) */}
      {activeTab === 'interests' && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">E. Areas of Interest (Dynamic Tags)</h2>
              <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                Drag rows or use arrow buttons to reorder. Only visible items appear on the public card.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNewInterestOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-mono font-bold cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Interest</span>
            </button>
          </div>

          {/* Inline Add New Interest Form */}
          {newInterestOpen && (
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">NEW INTEREST TAG</span>
                <button
                  type="button"
                  onClick={() => setNewInterestOpen(false)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[11px] font-mono text-[var(--text-secondary)]">Icon</label>
                  <button
                    type="button"
                    onClick={() => setIconPickerContext({ type: 'new-interest' })}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <AboutDynamicIcon name={newInterestForm.iconName} className="w-4 h-4 text-[var(--text-primary)]" />
                      <span className="truncate">{newInterestForm.iconName}</span>
                    </span>
                    <span className="text-[var(--text-secondary)] text-[10px]">Pick</span>
                  </button>
                </div>
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[11px] font-mono text-[var(--text-secondary)]">Tag Title *</label>
                  <input
                    type="text"
                    value={newInterestForm.title}
                    onChange={(e) => setNewInterestForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Distributed Systems"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
                  />
                </div>
                <div className="md:col-span-5 space-y-1">
                  <label className="text-[11px] font-mono text-[var(--text-secondary)]">Optional Tooltip Description</label>
                  <input
                    type="text"
                    value={newInterestForm.description}
                    onChange={(e) =>
                      setNewInterestForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Short description..."
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewInterestOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddInterest}
                  className="px-4 py-1.5 rounded-lg bg-[var(--accent-solid)] text-[var(--accent-contrast)] text-xs font-mono font-bold cursor-pointer"
                >
                  Add to Draft
                </button>
              </div>
            </div>
          )}

          {/* Interests List */}
          {draft.interests.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-[var(--border-subtle)] text-center space-y-2">
              <p className="text-sm text-[var(--text-secondary)]">No interest tags configured yet.</p>
              <p className="text-xs font-mono text-[var(--text-muted)]">
                Click "Add Interest" above to add your first focus area.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {draft.interests.map((interest, idx) => (
                <div
                  key={interest.id}
                  draggable
                  onDragStart={() => setDraggedInterestIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleInterestDrop(idx)}
                  onDragEnd={() => setDraggedInterestIdx(null)}
                  className={`p-4 rounded-xl border transition-all bg-[var(--bg-elevated)] ${
                    draggedInterestIdx === idx
                      ? 'border-[var(--border-strong)] opacity-60'
                      : interest.isVisible
                      ? 'border-[var(--border-subtle)]'
                      : 'border-[var(--border-subtle)] opacity-60'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    {/* Drag + Reorder */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-grab"
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <button
                        type="button"
                        onClick={() => moveInterest(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveInterest(idx, 1)}
                        disabled={idx === draft.interests.length - 1}
                        className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Icon Picker Trigger */}
                    <button
                      type="button"
                      onClick={() => setIconPickerContext({ type: 'interest', id: interest.id })}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] shrink-0 cursor-pointer"
                      title="Change icon"
                    >
                      <AboutDynamicIcon name={interest.iconName} className="w-4 h-4 text-[var(--text-primary)]" />
                      <span className="max-w-[90px] truncate">{interest.iconName}</span>
                    </button>

                    {/* Title & Description Inputs */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={interest.title}
                        onChange={(e) => updateInterest(interest.id, { title: e.target.value })}
                        placeholder="Interest Title *"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={interest.description || ''}
                        onChange={(e) =>
                          updateInterest(interest.id, { description: e.target.value })
                        }
                        placeholder="Optional description..."
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-xs text-[var(--text-secondary)] placeholder-[var(--text-muted)] focus:outline-none"
                      />
                    </div>

                    {/* Visibility & Delete */}
                    <div className="flex items-center gap-2 shrink-0 justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          updateInterest(interest.id, { isVisible: !interest.isVisible })
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-mono border cursor-pointer ${
                          interest.isVisible
                            ? 'bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text-primary)]'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                        }`}
                        title={interest.isVisible ? 'Visible on live card' : 'Hidden on live card'}
                      >
                        {interest.isVisible ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                        <span>{interest.isVisible ? 'Shown' : 'Hidden'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'interest',
                            id: interest.id,
                            title: interest.title || 'Untitled Interest',
                          })
                        }
                        className="p-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--accent-solid)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent-contrast)] cursor-pointer transition-colors"
                        title="Delete interest"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB E: BOTTOM HIGHLIGHTS PANEL (DYNAMIC CRUD + REORDERING) */}
      {activeTab === 'highlights' && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">F. Bottom Highlights Panel</h2>
              <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                Multi-column highlight blocks rendered at the bottom of the About glass card.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNewHighlightOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-mono font-bold cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Highlight</span>
            </button>
          </div>

          {newHighlightOpen && (
            <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">NEW HIGHLIGHT ITEM</span>
                <button
                  type="button"
                  onClick={() => setNewHighlightOpen(false)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[11px] font-mono text-[var(--text-secondary)]">Icon</label>
                  <button
                    type="button"
                    onClick={() => setIconPickerContext({ type: 'new-highlight' })}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <AboutDynamicIcon name={newHighlightForm.iconName} className="w-4 h-4 text-[var(--text-primary)]" />
                      <span className="truncate">{newHighlightForm.iconName}</span>
                    </span>
                    <span className="text-[var(--text-secondary)] text-[10px]">Pick</span>
                  </button>
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[11px] font-mono text-[var(--text-secondary)]">Title *</label>
                  <input
                    type="text"
                    value={newHighlightForm.title}
                    onChange={(e) => setNewHighlightForm((p) => ({ ...p, title: e.target.value }))}
                    placeholder="e.g. Open Source"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[11px] font-mono text-[var(--text-secondary)]">Supporting Text</label>
                  <input
                    type="text"
                    value={newHighlightForm.supportingText}
                    onChange={(e) =>
                      setNewHighlightForm((p) => ({ ...p, supportingText: e.target.value }))
                    }
                    placeholder="Optional short sublabel"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
                  />
                </div>
                <div className="md:col-span-3 space-y-1">
                  <label className="text-[11px] font-mono text-[var(--text-secondary)]">Tooltip Description</label>
                  <input
                    type="text"
                    value={newHighlightForm.description}
                    onChange={(e) =>
                      setNewHighlightForm((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Optional details"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewHighlightOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddHighlight}
                  className="px-4 py-1.5 rounded-lg bg-[var(--accent-solid)] text-[var(--accent-contrast)] text-xs font-mono font-bold cursor-pointer"
                >
                  Add to Draft
                </button>
              </div>
            </div>
          )}

          {draft.highlights.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-[var(--border-subtle)] text-center space-y-2">
              <p className="text-sm text-[var(--text-secondary)]">No highlights configured yet.</p>
              <p className="text-xs font-mono text-[var(--text-muted)]">
                Click "Add Highlight" above to create highlight cards.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {draft.highlights.map((highlight, idx) => (
                <div
                  key={highlight.id}
                  draggable
                  onDragStart={() => setDraggedHighlightIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleHighlightDrop(idx)}
                  onDragEnd={() => setDraggedHighlightIdx(null)}
                  className={`p-4 rounded-xl border transition-all bg-[var(--bg-elevated)] ${
                    draggedHighlightIdx === idx
                      ? 'border-[var(--border-strong)] opacity-60'
                      : highlight.isVisible
                      ? 'border-[var(--border-subtle)]'
                      : 'border-[var(--border-subtle)] opacity-60'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-grab"
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <button
                        type="button"
                        onClick={() => moveHighlight(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                        title="Move up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveHighlight(idx, 1)}
                        disabled={idx === draft.highlights.length - 1}
                        className="p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                        title="Move down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setIconPickerContext({ type: 'highlight', id: highlight.id })
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] shrink-0 cursor-pointer"
                    >
                      <AboutDynamicIcon name={highlight.iconName} className="w-4 h-4 text-[var(--text-primary)]" />
                      <span className="max-w-[90px] truncate">{highlight.iconName}</span>
                    </button>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        value={highlight.title}
                        onChange={(e) => updateHighlight(highlight.id, { title: e.target.value })}
                        placeholder="Highlight Title *"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={highlight.supportingText || ''}
                        onChange={(e) =>
                          updateHighlight(highlight.id, { supportingText: e.target.value })
                        }
                        placeholder="Supporting text (optional)"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-xs text-[var(--text-secondary)] placeholder-[var(--text-muted)] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={highlight.description || ''}
                        onChange={(e) =>
                          updateHighlight(highlight.id, { description: e.target.value })
                        }
                        placeholder="Tooltip description"
                        className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-xs text-[var(--text-secondary)] placeholder-[var(--text-muted)] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0 justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          updateHighlight(highlight.id, { isVisible: !highlight.isVisible })
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-[11px] font-mono border cursor-pointer ${
                          highlight.isVisible
                            ? 'bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text-primary)]'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {highlight.isVisible ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                        <span>{highlight.isVisible ? 'Shown' : 'Hidden'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            type: 'highlight',
                            id: highlight.id,
                            title: highlight.title || 'Untitled Highlight',
                          })
                        }
                        className="p-2 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--accent-solid)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent-contrast)] cursor-pointer transition-colors"
                        title="Delete highlight"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB F: SAFE VISUAL SETTINGS & VISIBILITY TOGGLES */}
      {activeTab === 'visual' && (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">G. Visual Controls & Visibility Switches</h2>
              <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                Safe design-system bounds to toggle components and refine spacing without risking broken layouts.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  header: {
                    ...prev.header,
                    showDivider: DEFAULT_ABOUT_VISUAL_SETTINGS.showSectionDivider,
                  },
                  portrait: {
                    ...prev.portrait,
                    scale: DEFAULT_ABOUT_VISUAL_SETTINGS.portraitScale,
                    fit: DEFAULT_ABOUT_VISUAL_SETTINGS.portraitFit,
                    focalPoint: DEFAULT_ABOUT_VISUAL_SETTINGS.portraitPosition,
                  },
                  visualSettings: { ...DEFAULT_ABOUT_VISUAL_SETTINGS },
                }))
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] cursor-pointer self-start"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[var(--text-primary)]" />
              <span>Reset Visual Defaults</span>
            </button>
          </div>

          {/* 8 Component Visibility Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {(
              [
                {
                  key: 'showPortrait',
                  label: 'Profile Portrait Column',
                  desc: 'Show the cosmic orbital portrait on the left column.',
                },
                {
                  key: 'showEducationBadge',
                  label: 'Floating Education Badge',
                  desc: 'Display the pill badge beneath the profile orb.',
                },
                {
                  key: 'showProfileCard',
                  label: 'Glassmorphism Profile Card',
                  desc: 'Display the right-hand profile bio & highlights card.',
                },
                {
                  key: 'showSignature',
                  label: 'Signature Graphic',
                  desc: 'Show uploaded signature top-right inside profile card.',
                },
                {
                  key: 'showInterestTags',
                  label: 'Interest Tags Row',
                  desc: 'Render dynamic pill tags below the intro paragraph.',
                },
                {
                  key: 'showHighlights',
                  label: 'Bottom Highlights Grid',
                  desc: 'Display the multi-column highlights bar inside the card.',
                },
                {
                  key: 'showSectionDivider',
                  label: 'Header Divider Accent',
                  desc: 'Show the thin glowing line beneath the section subtitle.',
                },
                {
                  key: 'showCosmicDecor',
                  label: 'Cosmic Orbital Rings & Glow',
                  desc: 'Toggle rotating orbital tracks and soft background glow.',
                },
              ] as const
            ).map((toggle) => {
              const active = Boolean(draft.visualSettings[toggle.key]);
              return (
                <div
                  key={toggle.key}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                >
                  <div>
                    <div className="text-xs font-mono font-semibold text-[var(--text-primary)]">{toggle.label}</div>
                    <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{toggle.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !active;
                      setDraft((prev) => ({
                        ...prev,
                        header:
                          toggle.key === 'showSectionDivider'
                            ? { ...prev.header, showDivider: nextVal }
                            : prev.header,
                        visualSettings: {
                          ...prev.visualSettings,
                          [toggle.key]: nextVal,
                        },
                      }));
                    }}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                      active
                        ? 'bg-[var(--accent-solid)] text-[var(--accent-contrast)]'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {active ? 'ON' : 'OFF'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bounded Layout Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[var(--border-subtle)]">
            <div className="space-y-2">
              <label className="block text-xs font-mono text-[var(--text-secondary)]">Card Spacing Density</label>
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'balanced', 'relaxed'] as const).map((spacing) => (
                  <button
                    key={spacing}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        visualSettings: { ...prev.visualSettings, cardSpacing: spacing },
                      }))
                    }
                    className={`py-2 rounded-xl text-[11px] font-mono capitalize border cursor-pointer ${
                      draft.visualSettings.cardSpacing === spacing
                        ? 'bg-[var(--accent-solid)] border-[var(--accent-solid)] text-[var(--accent-contrast)] font-bold'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {spacing}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-[var(--text-secondary)]">Card Corner Radius</label>
              <div className="grid grid-cols-3 gap-2">
                {(['lg', 'xl', '2xl'] as const).map((rad) => (
                  <button
                    key={rad}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        visualSettings: { ...prev.visualSettings, cardRadius: rad },
                      }))
                    }
                    className={`py-2 rounded-xl text-[11px] font-mono uppercase border cursor-pointer ${
                      draft.visualSettings.cardRadius === rad
                        ? 'bg-[var(--accent-solid)] border-[var(--accent-solid)] text-[var(--accent-contrast)] font-bold'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {rad}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono text-[var(--text-secondary)]">Cosmic Glow Intensity</label>
              <div className="grid grid-cols-3 gap-2">
                {(['subtle', 'medium', 'vivid'] as const).map((glow) => (
                  <button
                    key={glow}
                    type="button"
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        visualSettings: { ...prev.visualSettings, glowIntensity: glow },
                      }))
                    }
                    className={`py-2 rounded-xl text-[11px] font-mono capitalize border cursor-pointer ${
                      draft.visualSettings.glowIntensity === glow
                        ? 'bg-[var(--accent-solid)] border-[var(--accent-solid)] text-[var(--accent-contrast)] font-bold'
                        : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {glow}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. LIVE DRAFT PREVIEW MODAL (RENDERS ACTUAL <AboutSection />)       */}
      {/* =================================================================== */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-canvas)]/95 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[11px] font-mono text-[var(--text-primary)] font-bold">
                <Maximize2 className="w-3 h-3" />
                DRAFT LIVE PREVIEW
              </span>
              <span className="hidden sm:inline text-xs font-mono text-[var(--text-secondary)]">
                Unsaved draft preview — public site is unaffected until published.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] p-1">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono cursor-pointer ${
                    previewDevice === 'desktop'
                      ? 'bg-[var(--accent-solid)] text-[var(--accent-contrast)] font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'bg-[var(--accent-solid)] text-[var(--accent-contrast)] font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-primary)] cursor-pointer"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 sm:p-8 bg-[var(--bg-canvas)]">
            <div
              className={`w-full transition-all duration-300 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] overflow-hidden ${
                previewDevice === 'mobile' ? 'max-w-[420px]' : 'max-w-[1280px]'
              }`}
            >
              <AboutSection
                content={previewAboutContent}
                isPreviewMode={true}
                previewDevice={previewDevice}
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. MEDIA LIBRARY PICKER MODAL                                       */}
      {/* =================================================================== */}
      {mediaPickerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl">
            <MediaLibrary
              isModalPicker={true}
              selectedUrl={
                mediaPickerTarget === 'portrait'
                  ? draft.portrait.imageUrl
                  : draft.profileCard.signatureImageUrl
              }
              onSelectMedia={handleSelectFromMediaLibrary}
              onClose={() => setMediaPickerTarget(null)}
            />
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 6. VISUAL ICON PICKER MODAL                                         */}
      {/* =================================================================== */}
      {iconPickerContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Select Visual Icon</h3>
              <button
                type="button"
                onClick={() => {
                  setIconPickerContext(null);
                  setIconSearch('');
                }}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder="Search icons..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--border-strong)] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1">
                {(['All', 'Tech', 'Academic', 'Creator', 'Business'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setIconCategory(cat)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono cursor-pointer ${
                      iconCategory === cat
                        ? 'bg-[var(--accent-solid)] text-[var(--accent-contrast)] font-bold'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {filteredIcons.map((opt) => {
                const IconComp = opt.icon;
                return (
                  <button
                    key={opt.name}
                    type="button"
                    onClick={() => handleSelectIcon(opt.name)}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-center transition-colors cursor-pointer"
                  >
                    <IconComp className="w-5 h-5 text-[var(--text-primary)]" />
                    <span className="text-[11px] font-mono text-[var(--text-primary)] leading-tight">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 7. DELETE / UNPUBLISH / DISCARD CONFIRMATION MODALS                 */}
      {/* =================================================================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Remove {deleteTarget.type === 'interest' ? 'Interest Tag' : 'Highlight Card'}?
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              This will remove <span className="text-[var(--text-primary)] font-semibold">"{deleteTarget.title}"</span> from your draft. Public visitors will still see the published version until you click <span className="text-[var(--text-primary)] font-mono font-semibold">Publish Changes</span>.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteItem}
                className="px-4 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-xs font-mono font-bold text-[var(--accent-contrast)] cursor-pointer"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmUnpublishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Unpublish About Section?</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Unpublishing will hide the About section from public visitors on the portfolio site without deleting your content or draft. You can republish anytime.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmUnpublishOpen(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUnpublish}
                disabled={isUnpublishing}
                className="px-4 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
              >
                {isUnpublishing ? 'Unpublishing...' : 'Confirm Unpublish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDiscardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 space-y-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Discard Unpublished Draft?</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              This will revert all editor fields back to the currently published live About section state. Any unsaved or unpublished draft edits will be lost.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDiscardOpen(false)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                disabled={isDiscarding}
                className="px-4 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-xs font-mono font-bold text-[var(--accent-contrast)] cursor-pointer disabled:opacity-50"
              >
                {isDiscarding ? 'Discarding...' : 'Discard Draft'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 8. SUPABASE MIGRATION SQL MODAL                                     */}
      {/* =================================================================== */}
      {sqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Database className="w-4 h-4 text-[var(--text-primary)]" />
                  <span>About Section CMS — Idempotent Supabase Migration</span>
                </h3>
                <p className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                  Run this once in Supabase Dashboard → SQL Editor. Safe to re-run without losing existing data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSqlModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <pre className="max-h-96 overflow-auto p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-primary)] whitespace-pre-wrap select-all">
              {ABOUT_CMS_SQL_SCHEMA}
            </pre>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] font-mono text-[var(--text-muted)]">
                Full permission repair &amp; atomic publishing migration is also saved in /supabase/migrations/20261121_repair_admin_auth_and_cms_permissions.sql
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-solid)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-mono font-bold cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied SQL' : 'Copy SQL'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSqlModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
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
