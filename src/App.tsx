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

import { 
  PROJECTS, 
  JOURNEY, 
  HERO_CONTENT,
  ABOUT_CONTENT
} from './data/siteContent';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('hero');

  // Detect user preference for reduced motion
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // Canonical data sources from central siteContent.ts
  const projects = PROJECTS;
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
          content={HERO_CONTENT}
          onExploreWork={() => scrollToSection('work')}
          onExploreAbout={() => scrollToSection('about')}
          onConnect={() => scrollToSection('contact')}
        />

        {/* 2. ABOUT: Where you meet the builder & see personal editorial portrait */}
        <AboutSection content={ABOUT_CONTENT} />

        {/* 3. WORK: Interactive project showcase & concluding CTA */}
        <WorkUniverse 
          projects={projects} 
          onWorkTogether={() => scrollToSection('contact')}
        />

        {/* 4. JOURNEY: 2026 to 2030 Horizon */}
        <JourneyTimeline content={JOURNEY} milestones={milestones} />

        {/* 5. CONTACT: LET'S WORK TOGETHER (Dedicated final conclusion) */}
        <ContactSection />
      </main>

      {/* FOOTER: Lightweight return to cosmic darkness */}
      <Footer />
    </div>
  );
}
