import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ThemeToggle } from '../../context/ThemeContext';
import { AdminDashboard } from './AdminDashboard';
import { AdminSectionPlaceholder } from './AdminSectionPlaceholder';
import { HeroEditor } from './HeroEditor';
import { AboutEditor } from './AboutEditor';
import { ContactEditor } from './ContactEditor';
import { ProjectsEditor } from './ProjectsEditor';
import { JourneyEditor } from './JourneyEditor';
import { MediaLibrary } from './MediaLibrary';
import { SystemHealthPanel } from './SystemHealthPanel';
import {
  LayoutDashboard,
  Sparkles,
  User,
  FolderKanban,
  Compass,
  Mail,
  Image as ImageIcon,
  Settings as SettingsIcon,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  ChevronRight
} from 'lucide-react';

interface AdminLayoutProps {
  onNavigateHome?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onNavigateHome }) => {
  const { user, signOut } = useAdminAuth();
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'ADMIN' },
    { id: 'hero', label: 'Hero & Identity', icon: Sparkles, category: 'CONTENT' },
    { id: 'about', label: 'About Section', icon: User, category: 'CONTENT' },
    { id: 'projects', label: 'Work & Projects', icon: FolderKanban, category: 'CONTENT' },
    { id: 'journey', label: 'Journey Timeline', icon: Compass, category: 'CONTENT' },
    { id: 'contact', label: 'Contact & Socials', icon: Mail, category: 'CONTENT' },
    { id: 'media', label: 'Media Library', icon: ImageIcon, category: 'STORAGE' },
    { id: 'settings', label: 'System & Health', icon: SettingsIcon, category: 'SYSTEM' },
  ];

  const handleGoHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigateHome) {
      onNavigateHome();
    } else {
      window.location.href = '/';
    }
  };

  const handleSelectSection = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-300">

      {/* 1. Global Admin Header */}
      <header className="sticky top-0 z-30 w-full h-16 bg-[var(--bg-surface-blur)] border-b border-[var(--border-subtle)] backdrop-blur-md px-4 sm:px-6 flex items-center justify-between transition-colors duration-300">

        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-solid)] text-[var(--accent-contrast)] flex items-center justify-center font-mono font-black text-xs">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--text-primary)] text-sm tracking-tight font-mono">
                  AFRID AHMED
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)]">
                  CMS v1.0
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: User, Theme Toggle, Site Link & Sign Out */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)]">
            <Shield className="w-3.5 h-3.5 text-[var(--text-primary)]" />
            <span className="max-w-[180px] truncate text-[var(--text-primary)]">{user?.email}</span>
          </div>

          <ThemeToggle size="sm" />

          <button
            onClick={handleGoHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <span>LIVE SITE</span>
            <ExternalLink className="w-3.5 h-3.5 text-[var(--text-primary)]" />
          </button>

          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-xs font-mono text-[var(--text-primary)] transition-all cursor-pointer"
            title="Sign out of Admin CMS"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SIGN OUT</span>
          </button>
        </div>
      </header>

      {/* 2. Main Admin Layout: Sidebar + Content */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto overflow-hidden">

        {/* A. DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 space-y-6 shrink-0 transition-colors duration-300">

          <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--text-primary)] animate-pulse" />
              <span className="text-[11px] font-mono text-[var(--text-primary)] font-semibold">ADMIN VERIFIED</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)]">RLS ACTIVE</span>
          </div>

          <nav className="space-y-5 text-xs font-mono">
            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider px-3 mb-1.5">
                OVERVIEW
              </div>
              <button
                onClick={() => handleSelectSection('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  activeSection === 'dashboard'
                    ? 'bg-[var(--accent-solid)] text-[var(--accent-contrast)] font-bold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </div>

            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider px-3 mb-1.5">
                CONTENT SECTIONS
              </div>
              <div className="space-y-1">
                {navItems
                  .filter((item) => item.category === 'CONTENT')
                  .map((item) => {
                    const IconComp = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectSection(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[var(--accent-solid)] text-[var(--accent-contrast)] font-bold shadow-sm'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComp className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider px-3 mb-1.5">
                STORAGE & SYSTEM
              </div>
              <div className="space-y-1">
                {navItems
                  .filter((item) => item.category === 'STORAGE' || item.category === 'SYSTEM')
                  .map((item) => {
                    const IconComp = item.icon;
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectSection(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[var(--accent-solid)] text-[var(--accent-contrast)] font-bold shadow-sm'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComp className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
              </div>
            </div>
          </nav>

          <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-muted)] space-y-1">
            <div>DB: PostgreSQL (Supabase)</div>
            <div>AUTH: Admin Verified</div>
          </div>
        </aside>

        {/* B. MOBILE DRAWER NAVIGATION */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-16 z-20 bg-[var(--bg-canvas)]/95 backdrop-blur-xl p-4 lg:hidden overflow-y-auto space-y-4 border-b border-[var(--border-subtle)]">
            <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono">
              <span className="text-[var(--text-primary)] font-medium truncate">{user?.email}</span>
              <span className="text-[var(--text-secondary)] text-[10px]">ADMIN</span>
            </div>

            <nav className="space-y-3 font-mono text-xs">
              <div className="text-[10px] text-[var(--text-muted)] uppercase px-2">SECTIONS</div>
              {navItems.map((item) => {
                const IconComp = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-[var(--accent-solid)] text-[var(--accent-contrast)] font-bold'
                        : 'text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* C. MAIN CONTENT REGION */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {activeSection === 'dashboard' && (
            <AdminDashboard onSelectSection={handleSelectSection} />
          )}
          {activeSection === 'hero' && <HeroEditor />}
          {activeSection === 'about' && <AboutEditor />}
          {activeSection === 'projects' && <ProjectsEditor />}
          {activeSection === 'journey' && <JourneyEditor />}
          {activeSection === 'contact' && <ContactEditor />}
          {activeSection === 'settings' && <SystemHealthPanel />}
          {activeSection === 'media' && <MediaLibrary />}
          {!['dashboard', 'hero', 'about', 'projects', 'journey', 'contact', 'settings', 'media'].includes(activeSection) && (
            <AdminSectionPlaceholder sectionId={activeSection} />
          )}
        </main>

      </div>
    </div>
  );
};
