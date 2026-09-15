import React, { useState, useEffect } from 'react';
import { CosmicCanvas } from './components/CosmicCanvas';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { WorkUniverse } from './components/WorkUniverse';
import { JourneyTimeline } from './components/JourneyTimeline';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { CustomCursor } from './components/CustomCursor';
import { LoadingScreen } from './components/LoadingScreen';
import { AdminApp } from './admin/AdminApp';

import { 
  PROJECTS, 
  JOURNEY, 
  HERO_CONTENT,
  ABOUT_CONTENT,
  SITE_INFO,
  SOCIAL_LINKS
} from './data/siteContent';
import { HeroContent, AboutContent, SiteInfo, SocialLink, ProjectItem, JourneyMilestone } from './types';
import { 
  fetchPublicHeroContent, 
  fetchPublicAboutContent, 
  fetchPublicSiteSettings,
  fetchPublicProjects,
  fetchPublicCreatorVideos,
  fetchPublicJourneyMilestones,
  DbCreatorVideo
} from './services/contentService';

export default function App() {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname + window.location.hash;
    }
    return '/';
  });

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('hero');

  // Dynamic Supabase content state with initial static fallbacks
  const [heroData, setHeroData] = useState<HeroContent>(HERO_CONTENT);
  const [aboutData, setAboutData] = useState<AboutContent>(ABOUT_CONTENT);
  const [siteSettings, setSiteSettings] = useState<{ siteInfo: SiteInfo; socialLinks: SocialLink[] }>({
    siteInfo: SITE_INFO,
    socialLinks: SOCIAL_LINKS
  });
  const [projectsData, setProjectsData] = useState<ProjectItem[]>(PROJECTS);
  const [creatorVideosData, setCreatorVideosData] = useState<{
    featuredVideo: DbCreatorVideo | null;
    archiveVideos: DbCreatorVideo[];
  }>({
    featuredVideo: null,
    archiveVideos: []
  });
  const [journeyMilestones, setJourneyMilestones] = useState<JourneyMilestone[]>(JOURNEY.milestones);

  // Fetch published database content gracefully
  useEffect(() => {
    let isMounted = true;
    
    const loadPublishedContent = async () => {
      try {
        const [hero, about, settings, publishedProjects, creatorVideos, journeyRes] = await Promise.all([
          fetchPublicHeroContent(),
          fetchPublicAboutContent(),
          fetchPublicSiteSettings(),
          fetchPublicProjects(),
          fetchPublicCreatorVideos(),
          fetchPublicJourneyMilestones()
        ]);

        if (isMounted) {
          if (hero) setHeroData(hero);
          if (about) setAboutData(about);
          if (settings) setSiteSettings(settings);
          if (publishedProjects && publishedProjects.length > 0) {
            setProjectsData(publishedProjects);
          }
          if (creatorVideos) {
            setCreatorVideosData({
              featuredVideo: creatorVideos.featuredVideo,
              archiveVideos: creatorVideos.archiveVideos
            });
          }
          if (journeyRes && journeyRes.milestones && journeyRes.milestones.length > 0) {
            setJourneyMilestones(journeyRes.milestones);
          }
        }
      } catch (err) {
        console.warn('Public content load fallback active:', err);
      }
    };

    loadPublishedContent();

    return () => {
      isMounted = false;
    };
  }, []);

  // Detect user preference for reduced motion
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // Track browser navigation (back/forward & pushState)
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname + window.location.hash);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // Route: /admin (Private CMS)
  const isAdminRoute = currentPath.startsWith('/admin') || currentPath.startsWith('#/admin') || currentPath.startsWith('#admin');

  if (isAdminRoute) {
    return <AdminApp onNavigateHome={() => navigateTo('/')} />;
  }

  // Canonical data sources from central siteContent.ts
  const milestones = JOURNEY.milestones;

  // IntersectionObserver to update active navigation tab based on scroll position
  useEffect(() => {
    const sections = ['hero', 'about', 'work', 'journey', 'contact'];
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight * 0.35;
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const top = element.offsetTop;
          const height = element.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#03050B] text-[#F8FAFC] selection:bg-[#38BDF8]/20 selection:text-[#38BDF8] overflow-x-hidden">
      {/* 1. Procedural Multi-layer Cosmic Canvas (Stationary fixed in background) */}
      <CosmicCanvas reducedMotion={reducedMotion} />

      {/* 2. Context-aware desktop cursor */}
      <CustomCursor />

      {/* 3. Initial Cinematic Startup Sequence */}
      {loading && <LoadingScreen onLoaded={() => setLoading(false)} />}

      {/* 4. Floating Cosmic Navigation */}
      <Navigation
        activeSection={activeSection}
        onNavigate={scrollToSection}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={() => setReducedMotion(!reducedMotion)}
      />

      {/* Main Content Sections: Exact Hierarchy: Hero → About → Work → Journey → Contact */}
      <main className="relative z-10 w-full overflow-x-hidden">
        {/* 1. HERO: Personal brand first — AFRID AHMED */}
        <Hero
          content={heroData}
          onExploreWork={() => scrollToSection('work')}
          onExploreAbout={() => scrollToSection('about')}
          onConnect={() => scrollToSection('contact')}
        />

        {/* 2. ABOUT: Where you meet the builder & see personal editorial portrait */}
        <AboutSection content={aboutData} />

        {/* 3. WORK: Interactive project showcase & concluding CTA */}
        <WorkUniverse 
          projects={projectsData} 
          onWorkTogether={() => scrollToSection('contact')}
        />

        {/* 4. JOURNEY: 2026 to 2030 Horizon */}
        <JourneyTimeline content={JOURNEY} milestones={journeyMilestones} />

        {/* 5. CONTACT: LET'S WORK TOGETHER (Dedicated final conclusion) */}
        <ContactSection 
          siteInfo={siteSettings.siteInfo} 
          socialLinks={siteSettings.socialLinks} 
        />
      </main>

      {/* FOOTER: Lightweight return to cosmic darkness */}
      <Footer 
        siteInfo={siteSettings.siteInfo} 
        socialLinks={siteSettings.socialLinks} 
      />
    </div>
  );
}
