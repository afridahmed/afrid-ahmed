export interface SiteInfo {
  brandName: string;
  fullName: string;
  shortRole: string;
  fullRole: string;
  tagline: string;
  currentYear: string;
  graduationYear: string;
  email: string;
  location: string;
}

export interface HeroContent {
  badge: string;
  degreeTrack: string;
  graduationLabel: string;
  tagline: string;
  name: string;
  category: string;
  rotatingStatements: string[];
  description: string;
  primaryLinkText: string;
  secondaryLinkText: string;
  aboutLinkText: string;
  // Replace public/images/afrid-hero.jpg to change the Hero photo
  photo: string;
  scrollPromptText: string;
}

export interface TechStackGroup {
  category: string;
  items: string[];
}

export interface AboutContent {
  badge: string;
  title: string;
  statement: string;
  biography: string[];
  quote: string;
  graduationTag: string;
  // Replace public/images/afrid-about.jpg to change the About photo
  photo: string;
  photoCaption: {
    name: string;
    role: string;
    classYear: string;
    verifiedText: string;
  };
  techStack: TechStackGroup[];
}

export interface CreatorContent {
  badge: string;
  title: string;
  subtitle: string;
  studioLabel: string;
  categories: string[];
  videos: CreatorVideo[];
}

export interface JourneyContent {
  badge: string;
  title: string;
  subtitle: string;
  horizonAnchor: string;
  milestones: JourneyMilestone[];
}

export interface ProjectItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  technologies: string[];
  category: string;
  highlights: string[];
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  isFlagship?: boolean;
}

export interface SensorNode {
  id: string;
  name: string;
  parameter: string;
  unit: string;
  nominalRange: string;
  description: string;
  significance: string;
}

export interface CreatorVideo {
  id: string;
  title: string;
  category?: string;
  duration?: string;
  viewsPlaceholder?: string;
  summary?: string;
  description?: string;
  topics?: string[];
  isFeatured?: boolean;
  aspectRatio?: string;
  youtubeUrl?: string;
  thumbnail?: string;
}

export interface JourneyMilestone {
  year: string;
  phase: string;
  status: 'current' | 'upcoming' | 'aspirational';
  title: string;
  description: string;
  pillars: string[];
  focusAreas: string[];
}

export interface SocialLink {
  platform: string;
  label: string;
  url: string;
  iconName: string;
}

