import {
  SiteInfo,
  HeroContent,
  AboutContent,
  ProjectItem,
  CreatorContent,
  JourneyContent,
  SocialLink,
  SensorNode
} from '../types';
import {
  FEATURED_VIDEO,
  ADDITIONAL_VIDEOS,
  ALL_CREATOR_VIDEOS,
  CreatorVideoItem
} from './creatorContent';

export { FEATURED_VIDEO, ADDITIONAL_VIDEOS, ALL_CREATOR_VIDEOS };
export type { CreatorVideoItem };

// ============================================================================
// AFRID AHMED — AUTHORITATIVE WEBSITE CONTENT CONFIGURATION
//
// EDIT THIS FILE TO UPDATE ALL WEBSITE CONTENT.
// DO NOT MODIFY REACT COMPONENTS FOR TEXT OR ASSET PATH CHANGES.
// ============================================================================

/**
 * 1. SITE & GLOBAL BRAND INFORMATION
 */
export const SITE_INFO: SiteInfo = {
  brandName: 'AFRID',
  fullName: 'AFRID AHMED',
  shortRole: 'CS Undergraduate · 2030',
  fullRole: 'Computer Science Undergraduate · AI/ML Learner · Creator · Builder',
  tagline: "BUILDING WHAT'S NEXT.",
  currentYear: '2026',
  graduationYear: '2030',
  email: 'afridaskar@gmail.com',
  location: 'Earth Orbit · Global'
};

/**
 * 2. HERO SECTION CONTENT
 *
 * All text and links shown in the hero header.
 *
 * PHOTO INSTRUCTION:
 * // Replace public/images/afrid-hero.jpg to change the Hero photo
 * Keep the file path "/images/afrid-hero.jpg" below.
 */
export const HERO_CONTENT: HeroContent = {
  badge: "AFRID'S DIGITAL UNIVERSE",
  degreeTrack: 'COMPUTER SCIENCE',
  graduationLabel: '', // Removed from near AFRID'S DIGITAL UNIVERSE per user instructions
  tagline: "BUILDING WHAT'S NEXT.",
  name: 'AFRID AHMED',
  category: 'Computer Science · AI/ML · Creator',
  rotatingStatements: [
    'I BUILD.',
    'I CREATE.',
    'I EXPLORE.'
  ],
  description: 'Computer Science undergraduate building with AI, software and code while documenting the journey.',
  primaryLinkText: 'EXPLORE WORK',
  secondaryLinkText: "LET'S WORK TOGETHER",
  aboutLinkText: 'ABOUT AFRID',
  // Replace public/images/afrid-hero.jpg to change the Hero photo
  photo: '/images/afrid-hero.jpg',
  scrollPromptText: 'SCROLL TO EXPLORE'
};

/**
 * 3. ABOUT SECTION CONTENT
 *
 * Editorial personal portrait and authentic biography.
 *
 * PHOTO INSTRUCTION:
 * // Replace public/images/afrid-about.jpg to change the About photo
 * Keep the file path "/images/afrid-about.jpg" below.
 */
export const ABOUT_CONTENT: AboutContent = {
  badge: 'THE PERSON BEHIND THE CODE',
  title: 'ABOUT AFRID',
  statement: 'CURIOUS BY DEFAULT. BUILDING BY CHOICE.',
  biography: [
    'I am a Computer Science undergraduate exploring artificial intelligence, machine learning, physical computing, and software development. Rather than treating technology as abstract theory, I prefer learning through hands-on building—from configuring microcontrollers like the ESP32-S3 to writing reactive software interfaces.',
    'As a technology creator, I produce digital media breaking down complex computing architectures and developer workflows into clear, engaging visual stories. I believe that teaching concepts simply is the best test of truly understanding them.',
    'My current focus is building disciplined technical competence across algorithms, systems, and automation. Looking ahead toward 2030, I am driven by the prospect of entrepreneurship as a future direction—turning solid engineering principles into meaningful products and independent ventures.'
  ],
  quote: 'Every complex system starts with curiosity, a clean terminal, and the discipline to iterate.',
  graduationTag: 'EXPECTED GRADUATION: 2030',
  // Replace public/images/afrid-about.jpg to change the About photo
  photo: '/images/afrid-about.jpg',
  photoCaption: {
    name: 'AFRID AHMED',
    role: 'CS UNDERGRADUATE · CREATOR',
    classYear: 'CLASS OF 2030',
    verifiedText: 'Authentic stage · Honest representations'
  },
  techStack: [
    { category: 'Languages', items: ['C++', 'Python', 'TypeScript', 'JavaScript', 'Bash', 'SQL'] },
    { category: 'Systems & Hardware', items: ['ESP32-S3', 'Linux / Unix', 'I2C / SPI', 'Git', 'Docker basics'] },
    { category: 'Frameworks & Web', items: ['React', 'Node.js', 'Tailwind CSS', 'Vite', 'Express'] },
    { category: 'AI & Data Focus', items: ['ML Fundamentals', 'PyTorch Foundations', 'Prompt Engineering', 'Stream Decoders'] }
  ]
};

/**
 * 4. PROJECTS / WORK PORTFOLIO
 */
export const PROJECTS: ProjectItem[] = [
  {
    id: 'aquasense-x',
    number: '01',
    title: 'AquaSense X',
    subtitle: 'Embedded Environmental Intelligence',
    tagline: 'Physical Water Quality Telemetry & Software Diagnostics',
    description: 'An integrated hardware and software telemetry platform powered by the ESP32-S3 microcontroller. Captures real-time turbidity, Total Dissolved Solids (TDS), temperature, and pH variance, translating physical water attributes into instant software diagnostics.',
    technologies: ['ESP32-S3', 'C++', 'I2C / ADC Telemetry', 'TypeScript', 'WebSockets'],
    category: 'Hardware & IoT Engineering',
    highlights: [
      'Multi-parameter sensor acquisition: Turbidity, TDS, Temperature, and pH',
      'ESP32-S3 microcontroller processing raw analogue and digital sensor signals',
      'Signal calibration and noise suppression for aquatic monitoring',
      'Real-time software telemetry interface with dynamic safety thresholds'
    ],
    githubUrl: '',
    liveUrl: '',
    isFlagship: true
  },
  {
    id: 'naval-battle-simulator',
    number: '02',
    title: 'Naval Battle Simulator',
    subtitle: 'Grid Dynamics & Tactical Simulation',
    tagline: 'C-Based Tactical Simulation with Matrix Grid Coordination',
    description: 'A tactical naval combat simulator developed in C, modeling spatial grid coordination, randomized and strategic fleet placement, and turn-based battle mechanics.',
    technologies: ['C', 'Algorithms', 'Data Structures', 'Grid Logic', 'State Management'],
    category: 'Systems & Simulation',
    highlights: [
      'Coordinate matrix algorithms for ship placement and collision validation',
      'Targeting logic and grid-based coordinate calculation',
      'Deterministic turn-based state management and match resolution'
    ],
    githubUrl: '',
    liveUrl: '',
    isFlagship: false
  },
  {
    id: 'ai-cli-chatbot',
    number: '03',
    title: 'AI CLI Chatbot',
    subtitle: 'Developer Terminal Interface',
    tagline: 'Command-Line Interface for AI-Assisted Workflows',
    description: 'A command-line interface utility bringing conversational AI capabilities directly into terminal environments for developer assistance and automated shell queries.',
    technologies: ['Python / Shell', 'CLI', 'API Integration', 'Stream Processing'],
    category: 'AI & Developer Tooling',
    highlights: [
      'Interactive terminal session and prompt handling',
      'Streamed output rendering directly in shell environments',
      'Workflow assistance for developer queries and scripting'
    ],
    githubUrl: '',
    liveUrl: '',
    isFlagship: false
  },
  {
    id: 'weather-automation',
    number: '04',
    title: 'Weather / Automation Work',
    subtitle: 'Data Ingestion & Automated Triggers',
    tagline: 'Automated Meteorological Polling & Alert Pipeline',
    description: 'An automated environmental monitoring pipeline that periodically polls meteorological data from weather APIs, tracks environmental trends, and dispatches automated notifications.',
    technologies: ['Python', 'REST APIs', 'Automation', 'Cron / Scheduling', 'Webhooks'],
    category: 'Automation & Scripting',
    highlights: [
      'Automated weather data polling and parsing routines',
      'Threshold condition evaluation and alert trigger logic',
      'Scheduled execution and status notification dispatch'
    ],
    githubUrl: '',
    liveUrl: '',
    isFlagship: false
  }
];

/**
 * 5. CREATOR / YOUTUBE CONTENT
 * 
 * 1 Featured Flagship Video + 4 Extra Videos in Archive.
 * Direct YouTube links configured in src/data/creatorContent.ts.
 */
export const CREATOR_CONTENT: CreatorContent = {
  badge: 'DIGITAL MEDIA & HARDWARE STORYTELLING',
  title: 'CREATOR',
  subtitle: 'TECHNOLOGY, EXPLAINED SIMPLY.',
  studioLabel: 'STUDIO: 4K HIGH FIDELITY PRODUCTION',
  categories: [],
  videos: ALL_CREATOR_VIDEOS.map(v => ({
    id: v.id,
    title: v.title,
    category: v.category,
    duration: v.duration,
    viewsPlaceholder: v.isFeatured ? 'Flagship Production' : 'Archive Release',
    summary: v.description,
    description: v.description,
    topics: [v.category],
    isFeatured: v.isFeatured,
    youtubeUrl: v.youtubeUrl,
    thumbnail: v.thumbnail
  }))
};

/**
 * 6. JOURNEY TIMELINE (2026 -> 2030)
 */
export const JOURNEY: JourneyContent = {
  badge: 'ORBITAL TRAJECTORY · 2026 TO 2030',
  title: 'JOURNEY',
  subtitle: 'From academic computer science fundamentals to ambitious autonomous engineering.',
  horizonAnchor: 'HORIZON ANCHOR: GRADUATION 2030',
  milestones: [
    {
      year: '2026',
      phase: 'Foundation',
      status: 'current',
      title: 'Core Fundamentals & Active Building',
      description: 'Rigorous immersion in computer science principles: data structures, algorithmic complexity, low-level memory, and physical computing with the ESP32-S3. Establishing tech content creation to communicate engineering ideas cleanly.',
      pillars: ['Data Structures & Algorithms', 'C++ & Python Proficiency', 'AquaSense X Deployment', 'Tech Content Channel Launch'],
      focusAreas: ['CS Undergraduate Studies', 'Firmware & Electronics', 'Frontend Engineering', 'Media Storytelling']
    },
    {
      year: '2027',
      phase: 'Going Deeper',
      status: 'upcoming',
      title: 'Artificial Intelligence & Systems Engineering',
      description: 'Advancing beyond base algorithms into machine learning foundations, linear algebra for ML, neural network architectures, and robust full-stack software development.',
      pillars: ['Machine Learning Foundations', 'Distributed Systems Basics', 'Autonomous Software Agents', 'Advanced Content Series'],
      focusAreas: ['PyTorch & Mathematics', 'API Architecture', 'Embedded Edge ML', 'Technical Writing']
    },
    {
      year: '2028',
      phase: 'Real-World Experience',
      status: 'upcoming',
      title: 'Industry Immersion & Production Engineering',
      description: 'Applying theoretical and personal build experience to production environments, internships, team engineering, and shipping scalable software.',
      pillars: ['Engineering Internships', 'Large-Scale Codebases', 'Production CI/CD & Cloud', 'Freelance Technical Solutions'],
      focusAreas: ['Industry Best Practices', 'Team Collaboration', 'Software Reliability', 'Client Engagements']
    },
    {
      year: '2029',
      phase: 'Building More Seriously',
      status: 'upcoming',
      title: 'Complex Systems & Product Experimentation',
      description: 'Synthesizing hardware, AI/ML, and high-performance software into cohesive product prototypes. Exploring how technical capabilities translate into self-sustaining ventures.',
      pillars: ['Specialized AI Models', 'Hardware-Software Product Prototypes', 'Open Source Tooling', 'Venture Exploration'],
      focusAreas: ['Product Architecture', 'User Experience Design', 'System Scalability', 'Prototyping']
    },
    {
      year: '2030',
      phase: 'Graduation',
      status: 'aspirational',
      title: 'Graduation & Launching Into The Future',
      description: 'Completing the Computer Science degree as a disciplined software engineer, technical creator, and builder prepared to create innovative technological solutions and explore future entrepreneurship.',
      pillars: ['Degree Completion', 'Capstone Systems Project', 'Future Tech Venture Incubation', 'Continuous Innovation'],
      focusAreas: ['Full-Time Engineering', 'Technology Entrepreneurship', 'Long-term Research', 'Community Impact']
    }
  ]
};

/**
 * 7. SOCIAL & CONTACT LINKS
 */
export const SOCIAL_LINKS: SocialLink[] = [
  {
    platform: 'GitHub',
    label: 'github.com/afridaskar',
    url: 'https://github.com/afridaskar',
    iconName: 'Github'
  },
  {
    platform: 'LinkedIn',
    label: 'linkedin.com/in/afrid-ahmed',
    url: 'https://linkedin.com',
    iconName: 'Linkedin'
  },
  {
    platform: 'YouTube',
    label: '@afridtech',
    url: 'https://youtube.com',
    iconName: 'Youtube'
  },
  {
    platform: 'Email',
    label: 'afridaskar@gmail.com',
    url: 'mailto:afridaskar@gmail.com',
    iconName: 'Mail'
  }
];

export const CONTACT_CONTENT = {
  headline: "LET'S WORK.",
  supportingText: "Have an idea, automation workflow, AI project, or software build in mind?\nLet's build something useful.",
  ctaLabel: "LET'S TALK",
  badge: "COLLABORATION & INQUIRIES"
};

/**
 * AQUASENSE TELEMETRY NODES (Hardware visualizer telemetry)
 */
export const AQUASENSE_SENSORS: SensorNode[] = [
  {
    id: 'turbidity',
    name: 'Turbidity Sensor',
    parameter: 'Water Clarity',
    unit: 'NTU',
    nominalRange: '< 5.0 NTU',
    description: 'Measures suspended particulates via optical infrared scattering, identifying sediment and organic runoff in real time.',
    significance: 'Key indicator of aquatic filtration efficiency and sediment contamination.'
  },
  {
    id: 'tds',
    name: 'TDS Probe',
    parameter: 'Total Dissolved Solids',
    unit: 'ppm (mg/L)',
    nominalRange: '50 - 300 ppm',
    description: 'Measures electrical conductivity of ionic minerals (salts, calcium, magnesium) dissolved within the water sample.',
    significance: 'Determines mineral concentration and overall dissolved impurity levels.'
  },
  {
    id: 'temperature',
    name: 'DS18B20 Probe',
    parameter: 'Thermal Gradient',
    unit: '°C',
    nominalRange: '18.0 - 24.5 °C',
    description: 'Submersible digital thermal probe providing digital 12-bit precision temperature readings across the test chamber.',
    significance: 'Critical calibration factor for temperature-dependent pH and conductivity calculations.'
  },
  {
    id: 'ph',
    name: 'pH Electrode Concept',
    parameter: 'Acid / Alkaline Balance',
    unit: 'pH',
    nominalRange: '6.5 - 8.5 pH',
    description: 'Electrochemical probe concept measuring hydrogen-ion activity for acid-base equilibrium detection.',
    significance: 'Fundamental chemical metric for biological safety and chemical neutrality.'
  }
];

// Re-exports for backward compatibility
export const PERSONAL_INFO = {
  name: SITE_INFO.fullName,
  role: SITE_INFO.fullRole,
  tagline: SITE_INFO.tagline,
  supportingLine: HERO_CONTENT.description,
  graduationYear: SITE_INFO.graduationYear,
  currentYear: SITE_INFO.currentYear,
  email: SITE_INFO.email,
  location: SITE_INFO.location,
  aboutHeadline: ABOUT_CONTENT.title,
  aboutLargeStatement: ABOUT_CONTENT.statement,
  bioParagraphs: ABOUT_CONTENT.biography,
  quote: ABOUT_CONTENT.quote
};

export const PROJECTS_DATA = PROJECTS;
export const CREATOR_VIDEOS = CREATOR_CONTENT.videos;
export const JOURNEY_MILESTONES = JOURNEY.milestones;
