import React from 'react';
import { 
  Sparkles, 
  User, 
  FolderKanban, 
  Video, 
  Compass, 
  Mail, 
  Image as ImageIcon, 
  Settings as SettingsIcon,
  Database,
  ArrowUpRight
} from 'lucide-react';

interface AdminSectionPlaceholderProps {
  sectionId: string;
}

const SECTION_METADATA: Record<string, {
  title: string;
  category: string;
  tableName: string;
  description: string;
  fields: string[];
  icon: React.ElementType;
}> = {
  hero: {
    title: 'Hero Content Editor',
    category: 'CONTENT / HERO',
    tableName: 'hero_content',
    description: 'Manages the main personal brand headline, dynamic rotating phrases, intro description, hero image, and call-to-action buttons.',
    fields: ['name', 'identity', 'tagline', 'description', 'rotating_phrases', 'hero_image_url', 'primary_cta_label', 'primary_cta_url', 'secondary_cta_label', 'secondary_cta_url'],
    icon: Sparkles
  },
  about: {
    title: 'About Narrative & Pillars',
    category: 'CONTENT / ABOUT',
    tableName: 'about_content',
    description: 'Controls the editorial biographical narrative, philosophical quote, image captions, and categorized technical stack groups.',
    fields: ['heading', 'statement', 'bio', 'about_image_url', 'skills', 'quote', 'badge', 'graduation_tag', 'photo_caption_role'],
    icon: User
  },
  projects: {
    title: 'Work & Projects Catalog',
    category: 'CONTENT / PROJECTS',
    tableName: 'projects',
    description: 'Create, update, reorder, feature, and toggle publication status for portfolio software and hardware projects.',
    fields: ['title', 'slug', 'subtitle', 'tagline', 'category', 'description', 'technologies', 'highlights', 'github_url', 'live_url', 'is_flagship', 'display_order', 'is_published'],
    icon: FolderKanban
  },
  youtube: {
    title: 'YouTube & Creator Showcase',
    category: 'CONTENT / YOUTUBE',
    tableName: 'creator_videos',
    description: 'Manage flagship video selection and video archive items with titles, duration, YouTube URLs, thumbnails, and ordering.',
    fields: ['video_id', 'title', 'category', 'duration', 'youtube_url', 'thumbnail_url', 'is_featured', 'display_order', 'is_published'],
    icon: Video
  },
  journey: {
    title: 'Journey & Trajectory Milestones',
    category: 'CONTENT / JOURNEY',
    tableName: 'journey_milestones',
    description: 'Curate timeline milestones from foundations to future horizons beyond 2030 with phase definitions and core focus pillars.',
    fields: ['year', 'phase', 'title', 'description', 'pillars', 'is_current', 'is_horizon', 'display_order', 'is_published'],
    icon: Compass
  },
  contact: {
    title: 'Contact & Global Settings',
    category: 'CONTENT / CONTACT',
    tableName: 'site_settings',
    description: 'Configure primary contact email, global owner identity, site title, and official social media profile links.',
    fields: ['owner_name', 'site_title', 'primary_email', 'github_url', 'linkedin_url', 'youtube_url'],
    icon: Mail
  },
  media: {
    title: 'Media Asset Registry',
    category: 'STORAGE / MEDIA',
    tableName: 'media',
    description: 'Centralized registry for images and assets stored in the Supabase Storage bucket.',
    fields: ['bucket', 'file_path', 'public_url', 'file_name', 'media_type', 'file_size_bytes', 'alt_text'],
    icon: ImageIcon
  },
  settings: {
    title: 'CMS System Settings',
    category: 'SYSTEM / CONFIGURATION',
    tableName: 'site_settings & admin_users',
    description: 'Administrative settings, Supabase connection status, environment secrets verification, and security controls.',
    fields: ['connection status', 'admin account', 'RLS verification', 'cache controls'],
    icon: SettingsIcon
  }
};

export const AdminSectionPlaceholder: React.FC<AdminSectionPlaceholderProps> = ({ sectionId }) => {
  const meta = SECTION_METADATA[sectionId] || {
    title: 'Section Overview',
    category: 'CONTENT',
    tableName: 'supabase_table',
    description: 'Module configuration ready for CRUD editor connection.',
    fields: ['id', 'created_at', 'updated_at'],
    icon: Database
  };

  const IconComponent = meta.icon;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="text-xs font-mono text-[#38BDF8] tracking-widest uppercase">
            {meta.category}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
            <IconComponent className="w-6 h-6 text-[#38BDF8]" />
            <span>{meta.title}</span>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1.5 font-light">
            {meta.description}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0E131F] border border-white/10 text-xs font-mono text-[#94A3B8] self-start sm:self-auto">
          <Database className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>TABLE: {meta.tableName}</span>
        </div>
      </div>

      {/* Readiness Notice Card */}
      <div className="rounded-2xl border border-white/10 bg-[#0E131F]/80 p-6 backdrop-blur-md space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 shrink-0 animate-pulse" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white font-mono">
              CMS SHELL ACTIVE — CRUD EDITOR INTEGRATION PHASE PREPARED
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              The database schema and Row Level Security permissions for <code className="text-[#38BDF8] font-mono">{meta.tableName}</code> are established in Supabase. Interactive forms and live content synchronization will be wired in the upcoming editing phase.
            </p>
          </div>
        </div>

        {/* Database Fields Preview */}
        <div className="pt-4 border-t border-white/5 space-y-2.5">
          <div className="text-[11px] font-mono text-[#64748B] uppercase tracking-wider">
            SCHEMA FIELDS READY FOR EDITING
          </div>
          <div className="flex flex-wrap gap-2">
            {meta.fields.map((field) => (
              <span
                key={field}
                className="px-2.5 py-1 rounded-md bg-[#080B11] border border-white/10 text-xs font-mono text-[#CBD5E1]"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
