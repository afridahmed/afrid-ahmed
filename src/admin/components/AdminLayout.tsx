import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { AdminDashboard } from './AdminDashboard';
import { AdminSectionPlaceholder } from './AdminSectionPlaceholder';
import { HeroEditor } from './HeroEditor';
import { AboutEditor } from './AboutEditor';
import { ContactEditor } from './ContactEditor';
import { ProjectsEditor } from './ProjectsEditor';
import { JourneyEditor } from './JourneyEditor';
import { MediaLibrary } from './MediaLibrary';
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
    
    // CONTENT category
    { id: 'hero', label: 'Hero & Identity', icon: Sparkles, category: 'CONTENT' },
    { id: 'about', label: 'About Narrative', icon: User, category: 'CONTENT' },
    { id: 'projects', label: 'Work & Projects', icon: FolderKanban, category: 'CONTENT' },
    { id: 'journey', label: 'Journey Timeline', icon: Compass, category: 'CONTENT' },
    { id: 'contact', label: 'Contact & Socials', icon: Mail, category: 'CONTENT' },
    
    // STORAGE category
    { id: 'media', label: 'Media Library', icon: ImageIcon, category: 'STORAGE' },
    
    // SITE SETTINGS category
    { id: 'settings', label: 'Site Settings', icon: SettingsIcon, category: 'SITE' },
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
    <div className="min-h-screen bg-[#080B11] text-[#E2E8F0] flex flex-col font-sans">
      
      {/* 1. Global Admin Header */}
      <header className="sticky top-0 z-30 w-full h-16 bg-[#0E131F]/90 border-b border-white/10 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
        
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-[#141B2D] border border-white/10 text-white hover:text-[#38BDF8] transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#38BDF8] text-[#080B11] flex items-center justify-center font-mono font-black text-xs">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm tracking-tight font-mono">
                  AFRID AHMED
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.2 rounded-md bg-[#141B2D] border border-white/10 text-[10px] font-mono text-[#38BDF8]">
                  CMS v1.0
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: User, Site Link & Sign Out */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* User Email Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#080B11] border border-white/5 text-xs font-mono text-[#94A3B8]">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span className="max-w-[180px] truncate text-white">{user?.email}</span>
          </div>

          {/* View Public Site */}
          <button
            onClick={handleGoHome}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141B2D] hover:bg-[#1A233A] border border-white/10 text-xs font-mono text-[#CBD5E1] transition-all cursor-pointer"
          >
            <span>LIVE SITE</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
          </button>

          {/* Sign Out Button */}
          <button
            onClick={() => signOut()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-mono text-rose-300 transition-all cursor-pointer"
            title="Sign out of Admin CMS"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SIGN OUT</span>
          </button>
        </div>
      </header>

      {/* 2. Main Admin Layout: Sidebar + Content */}
      <div className="flex-1 flex w-full max-w-[1600px] mx-auto overflow-hidden">
        
        {/* ========================================================================= */}
        {/* A. DESKTOP SIDEBAR                                                        */}
        {/* ========================================================================= */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-white/10 bg-[#0E131F]/50 p-4 space-y-6 shrink-0">
          
          {/* Status Capsule */}
          <div className="p-3 rounded-xl bg-[#080B11] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono text-white font-semibold">ADMIN VERIFIED</span>
            </div>
            <span className="text-[10px] font-mono text-[#64748B]">RLS ACTIVE</span>
          </div>

          {/* Navigation Structure */}
          <nav className="space-y-5 text-xs font-mono">
            {/* 1. DASHBOARD */}
            <div>
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider px-3 mb-1.5">
                OVERVIEW
              </div>
              <button
                onClick={() => handleSelectSection('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  activeSection === 'dashboard'
                    ? 'bg-[#38BDF8] text-[#080B11] font-bold shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#141B2D]/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            </div>

            {/* 2. CONTENT */}
            <div>
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider px-3 mb-1.5">
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
                            ? 'bg-[#38BDF8] text-[#080B11] font-bold shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                            : 'text-[#94A3B8] hover:text-white hover:bg-[#141B2D]/60'
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

            {/* 3. MEDIA & SYSTEM */}
            <div>
              <div className="text-[10px] text-[#64748B] uppercase tracking-wider px-3 mb-1.5">
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
                            ? 'bg-[#38BDF8] text-[#080B11] font-bold shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                            : 'text-[#94A3B8] hover:text-white hover:bg-[#141B2D]/60'
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

          {/* Sidebar Footer */}
          <div className="mt-auto pt-4 border-t border-white/5 text-[11px] font-mono text-[#475569] space-y-1">
            <div>DB: PostgreSQL (Supabase)</div>
            <div>AUTH: Admin Verified</div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* B. MOBILE DRAWER NAVIGATION                                               */}
        {/* ========================================================================= */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-16 z-20 bg-[#080B11]/95 backdrop-blur-xl p-4 lg:hidden overflow-y-auto space-y-4 border-b border-white/10">
            <div className="p-3 rounded-xl bg-[#0E131F] border border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-white font-medium truncate">{user?.email}</span>
              <span className="text-emerald-400 text-[10px]">ADMIN</span>
            </div>

            <nav className="space-y-3 font-mono text-xs">
              <div className="text-[10px] text-[#64748B] uppercase px-2">SECTIONS</div>
              {navItems.map((item) => {
                const IconComp = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectSection(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-[#38BDF8] text-[#080B11] font-bold'
                        : 'text-[#CBD5E1] bg-[#0E131F]/60'
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

        {/* ========================================================================= */}
        {/* C. MAIN CONTENT REGION                                                    */}
        {/* ========================================================================= */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {activeSection === 'dashboard' && (
            <AdminDashboard onSelectSection={handleSelectSection} />
          )}
          {activeSection === 'hero' && <HeroEditor />}
          {activeSection === 'about' && <AboutEditor />}
          {activeSection === 'projects' && <ProjectsEditor />}
          {activeSection === 'journey' && <JourneyEditor />}
          {(activeSection === 'contact' || activeSection === 'settings') && <ContactEditor />}
          {activeSection === 'media' && <MediaLibrary />}
          {!['dashboard', 'hero', 'about', 'projects', 'journey', 'contact', 'settings', 'media'].includes(activeSection) && (
            <AdminSectionPlaceholder sectionId={activeSection} />
          )}
        </main>

      </div>
    </div>
  );
};
