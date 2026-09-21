import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Globe,
  User,
  Github,
  Linkedin,
  Youtube,
  Send,
  Sparkles
} from 'lucide-react';
import { 
  DbSiteSettings, 
  DEFAULT_DB_SETTINGS, 
  getAdminSiteSettings, 
  saveAdminSiteSettings,
  seedDefaultSiteSettingsIfEmpty
} from '../../services/contentService';

export const ContactEditor: React.FC = () => {
  const [formData, setFormData] = useState<DbSiteSettings>(DEFAULT_DB_SETTINGS);
  const [initialData, setInitialData] = useState<DbSiteSettings>(DEFAULT_DB_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    const { data, error } = await getAdminSiteSettings();
    if (error) {
      setStatusMessage({ type: 'error', text: `Failed to load from database: ${error}` });
      setFormData(DEFAULT_DB_SETTINGS);
      setInitialData(DEFAULT_DB_SETTINGS);
    } else if (data) {
      setFormData(data);
      setInitialData(data);
    } else {
      setFormData(DEFAULT_DB_SETTINGS);
      setInitialData(DEFAULT_DB_SETTINGS);
    }
    setIsLoading(false);
  };

  const handleSeedDefaults = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await seedDefaultSiteSettingsIfEmpty();
      if (res.seeded) {
        setStatusMessage({ type: 'success', text: 'Default contact settings seeded to Supabase!' });
        await loadSettingsData();
      } else if (res.error) {
        setStatusMessage({ type: 'error', text: `Seed error: ${res.error}` });
      } else {
        setStatusMessage({ type: 'success', text: 'Supabase already contains site settings.' });
        await loadSettingsData();
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Seed failed' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    // Basic email validation
    const emailToSave = (formData.primary_email || formData.contact_email || '').trim();
    if (!emailToSave || !emailToSave.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Please provide a valid primary email address.' });
      setIsSaving(false);
      return;
    }

    const payloadWithDefaults: DbSiteSettings = {
      ...formData,
      primary_email: emailToSave,
      contact_email: emailToSave,
      owner_name: formData.owner_name?.trim() || 'Afrid Ahmed',
      site_title: formData.site_title?.trim() || 'Afrid Ahmed | Portfolio',
    };

    const { success, error } = await saveAdminSiteSettings(payloadWithDefaults);
    if (success) {
      setInitialData(payloadWithDefaults);
      setFormData(payloadWithDefaults);
      setStatusMessage({ type: 'success', text: 'Contact channels and site settings updated successfully in Supabase!' });
    } else {
      setStatusMessage({ type: 'error', text: error || 'Failed to save changes to database.' });
    }
    setIsSaving(false);
  };

  const handleReset = () => {
    setFormData(initialData);
    setStatusMessage(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3 font-mono text-xs text-[#94A3B8]">
        <Loader2 className="w-6 h-6 text-[#38BDF8] animate-spin" />
        <span>FETCHING CONTACT & SITE SETTINGS FROM SUPABASE...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="text-xs font-mono text-[#38BDF8] tracking-widest uppercase">
            COMMUNICATION & CHANNELS
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
            <Mail className="w-6 h-6 text-[#38BDF8]" />
            <span>Contact & Social Channels Editor</span>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1 font-light">
            Manage your primary contact email, brand metadata, and direct social profile URLs across the portfolio.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSeedDefaults}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl bg-[#0E131F] hover:bg-[#141B2D] border border-white/10 text-xs font-mono text-[#94A3B8] hover:text-[#38BDF8] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Seed default contact settings into Supabase"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>SEED DEFAULTS</span>
          </button>

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
        
        {/* Core Site Settings Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0E131F]/80 p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 text-xs font-mono text-[#38BDF8] uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            <span>GLOBAL METADATA & IDENTITY</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Owner Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>PORTFOLIO OWNER NAME</span>
              </label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                placeholder="Afrid Ahmed"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Site Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>GLOBAL SITE TITLE</span>
              </label>
              <input
                type="text"
                value={formData.site_title}
                onChange={(e) => setFormData({ ...formData, site_title: e.target.value })}
                placeholder="Afrid Ahmed · Portfolio"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Primary Email */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>PRIMARY INBOX EMAIL (FOR "LET'S TALK" & DIRECT REACH)</span>
              </label>
              <input
                type="email"
                value={formData.primary_email}
                onChange={(e) => setFormData({ ...formData, primary_email: e.target.value })}
                placeholder="afridaskar@gmail.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white placeholder-[#475569] text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
              <p className="text-[11px] text-[#64748B] font-mono">
                This email address is connected to the primary "LET'S TALK" mailto link and the contact card.
              </p>
            </div>
          </div>
        </div>

        {/* Direct Reach & Social Links Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0E131F]/80 p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 text-xs font-mono text-[#38BDF8] uppercase tracking-wider">
            <Send className="w-4 h-4" />
            <span>PLATFORMS & SOCIAL PROFILE LINKS</span>
          </div>

          <div className="space-y-4">
            {/* GitHub */}
            <div className="space-y-1.5 p-4 rounded-xl bg-[#080B11] border border-white/5">
              <label className="block text-xs font-mono text-[#CBD5E1] flex items-center gap-2">
                <Github className="w-4 h-4 text-[#38BDF8]" />
                <span>GITHUB PROFILE URL</span>
              </label>
              <input
                type="url"
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                placeholder="https://github.com/afridaskar"
                className="w-full px-3 py-2 rounded-lg bg-[#0E131F] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-1.5 p-4 rounded-xl bg-[#080B11] border border-white/5">
              <label className="block text-xs font-mono text-[#CBD5E1] flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-[#38BDF8]" />
                <span>LINKEDIN PROFILE URL</span>
              </label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com"
                className="w-full px-3 py-2 rounded-lg bg-[#0E131F] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* YouTube */}
            <div className="space-y-1.5 p-4 rounded-xl bg-[#080B11] border border-white/5">
              <label className="block text-xs font-mono text-[#CBD5E1] flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-400" />
                <span>YOUTUBE CHANNEL URL</span>
              </label>
              <input
                type="url"
                value={formData.youtube_url}
                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                placeholder="https://youtube.com"
                className="w-full px-3 py-2 rounded-lg bg-[#0E131F] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Instagram */}
            <div className="space-y-1.5 p-4 rounded-xl bg-[#080B11] border border-white/5">
              <label className="block text-xs font-mono text-[#CBD5E1] flex items-center gap-2">
                <Send className="w-4 h-4 text-pink-400" />
                <span>INSTAGRAM PROFILE URL</span>
              </label>
              <input
                type="url"
                value={formData.instagram_url || ''}
                onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                placeholder="https://instagram.com"
                className="w-full px-3 py-2 rounded-lg bg-[#0E131F] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>
        </div>

        {/* Contact Section Editorial Copy Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0E131F]/80 p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/5 text-xs font-mono text-[#38BDF8] uppercase tracking-wider">
            <Mail className="w-4 h-4" />
            <span>CONTACT SECTION EDITORIAL COPY</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Contact Headline */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1]">
                SECTION HEADLINE
              </label>
              <input
                type="text"
                value={formData.contact_headline || ''}
                onChange={(e) => setFormData({ ...formData, contact_headline: e.target.value })}
                placeholder="LET'S WORK."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Primary CTA Label */}
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1]">
                PRIMARY BUTTON TEXT
              </label>
              <input
                type="text"
                value={formData.primary_cta_label || ''}
                onChange={(e) => setFormData({ ...formData, primary_cta_label: e.target.value })}
                placeholder="LET'S TALK"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Supporting Text */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-mono text-[#CBD5E1]">
                SUPPORTING EDITORIAL MESSAGE
              </label>
              <textarea
                rows={3}
                value={formData.contact_supporting_text || ''}
                onChange={(e) => setFormData({ ...formData, contact_supporting_text: e.target.value })}
                placeholder="Have an idea, automation workflow, AI project, or software build in mind?&#10;Let's build something useful."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#080B11] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#38BDF8] resize-none"
              />
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
                <span>SAVE & PUBLISH SETTINGS</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
