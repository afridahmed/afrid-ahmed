# Quick Website Maintenance & Content Guide

Welcome! This guide explains how to update any text, project, video, milestone, or photo on your website in seconds.

Everything you need to edit is in **one central data file**:
👉 `src/data/siteContent.ts`

And your two photos live in:
👉 `public/images/`

You **never** need to touch React components or HTML code to update your information.

---

## Table of Contents

1. [Replacing Photos (Hero & About)](#1-replacing-photos)
2. [Changing Hero Name, Rotating Phrases & Description](#2-changing-hero-content)
3. [Changing About Title, Statement & Biography](#3-changing-about-content)
4. [Adding or Editing Projects](#4-adding-or-editing-projects)
5. [Updating YouTube Videos & Topics](#5-updating-youtube-videos)
6. [Updating Social & Contact Links](#6-updating-social-links)
7. [Editing Journey Milestones (2026–2030)](#7-editing-journey-milestones)
8. [Updating the Now (Active Priorities) Section](#8-updating-the-now-section)
9. [Updating Basic Site Info (Graduation, Tagline, Email)](#9-updating-basic-site-info)

---

## 1. Replacing Photos

### Hero Photo
- **File location**: `public/images/afrid-hero.jpg`
- **How to update**:
  1. Prepare your new portrait or photo.
  2. Name it `afrid-hero.jpg`.
  3. Replace the file inside `public/images/`.
  4. The website will automatically update with your new hero portrait!
  *(Configured in `src/data/siteContent.ts` under `HERO_CONTENT.photo`)*

### About Section Photo
- **File location**: `public/images/afrid-about.jpg`
- **How to update**:
  1. Prepare your editorial portrait.
  2. Name it `afrid-about.jpg`.
  3. Replace the file inside `public/images/`.
  4. The website will automatically update with your new photo!
  *(Configured in `src/data/siteContent.ts` under `ABOUT_CONTENT.photo`)*

> **Tip**: You can use the same image file for both or different images. The Hero automatically applies a deep cosmic blending effect, while the About section applies a calmer editorial frame.

---

## 2. Changing Hero Content

**File path**: `src/data/siteContent.ts`  
**Look for**: `HERO_CONTENT`

```typescript
export const HERO_CONTENT: HeroContent = {
  badge: "AFRID'S DIGITAL UNIVERSE",
  degreeTrack: 'COMPUTER SCIENCE',
  graduationLabel: 'GRADUATION 2030',
  tagline: "BUILDING WHAT'S NEXT.",
  name: 'AFRID AHMED',                       // <-- Change your name here
  category: 'Computer Science · AI/ML · Technology · Creator', // <-- Change category subtitle
  rotatingStatements: [                      // <-- Change or add rotating phrases
    'I BUILD.',
    'I CREATE.',
    'I EXPLORE.'
  ],
  description: 'Computer Science undergraduate building with AI...', // <-- Change short bio
  primaryLinkText: 'EXPLORE WORK',
  secondaryLinkText: 'WATCH YOUTUBE',
  aboutLinkText: 'ABOUT AFRID',
  photo: '/images/afrid-hero.jpg',
  scrollPromptText: 'SCROLL TO EXPLORE'
};
```

---

## 3. Changing About Content

**File path**: `src/data/siteContent.ts`  
**Look for**: `ABOUT_CONTENT`

```typescript
export const ABOUT_CONTENT: AboutContent = {
  badge: 'THE PERSON BEHIND THE CODE',
  title: 'ABOUT AFRID',                      // <-- Section title
  statement: 'CURIOUS BY DEFAULT. BUILDING BY CHOICE.', // <-- Bold quote/statement
  biography: [                               // <-- Paragraphs of your story
    'First paragraph goes here...',
    'Second paragraph goes here...',
    'Third paragraph goes here...'
  ],
  quote: 'Every complex system starts with curiosity...', // <-- Personal quote
  graduationTag: 'EXPECTED GRADUATION: 2030',
  photo: '/images/afrid-about.jpg',
  photoCaption: {
    name: 'AFRID AHMED',
    role: 'CS UNDERGRADUATE · CREATOR',
    classYear: 'CLASS OF 2030',
    verifiedText: 'Authentic stage · Honest representations'
  },
  techStack: [                               // <-- Your skills by category
    { category: 'Languages', items: ['C++', 'Python', 'TypeScript', 'Bash'] },
    // Add more categories here
  ]
};
```

---

## 4. Adding or Editing Projects

**File path**: `src/data/siteContent.ts`  
**Look for**: `PROJECTS`

Each project is an object in the array:

```typescript
{
  id: 'my-project-id',
  number: '01',                              // <-- Two-digit number (01, 02, etc.)
  title: 'AquaSense X',                      // <-- Project Title
  subtitle: 'Embedded Environmental Intelligence',
  tagline: 'Short one-line description',
  description: 'Detailed description of the project...',
  technologies: ['ESP32-S3', 'C++', 'TypeScript', 'Tailwind CSS'], // <-- Badges
  category: 'Hardware & IoT Engineering',
  highlights: [
    'Feature 1',
    'Feature 2'
  ],
  githubUrl: 'https://github.com/afridaskar', // <-- GitHub repo link
  liveUrl: '#',                               // <-- Live demo link
  isFlagship: true                            // <-- Set to true for your main showcase
}
```

To reorder projects, simply reorder them in the array!

---

## 5. Updating YouTube Videos

**File path**: `src/data/siteContent.ts`  
**Look for**: `CREATOR_CONTENT`

To add or edit a video:

```typescript
{
  id: 'vid-01',
  title: 'Demystifying Edge AI: Running Neural Networks on Microcontrollers',
  category: 'AI & Automation',               // <-- Must match one of the categories
  duration: '14:28',
  viewsPlaceholder: 'Upcoming Release',
  summary: 'Short summary of the video topic...',
  topics: ['Edge Computing', 'TensorFlow Lite', 'ESP32'],
  isFeatured: true                           // <-- The featured video appears largest
}
```

---

## 6. Updating Social Links

**File path**: `src/data/siteContent.ts`  
**Look for**: `SOCIAL_LINKS`

```typescript
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
```

---

## 7. Editing Journey Milestones

**File path**: `src/data/siteContent.ts`  
**Look for**: `JOURNEY`

Each milestone represents a year (2026 through 2030):

```typescript
{
  year: '2026',
  phase: 'Foundation',
  status: 'current',                         // 'current' | 'upcoming' | 'aspirational'
  title: 'Core Fundamentals & Active Building',
  description: 'What you are working on this year...',
  pillars: ['Data Structures', 'AquaSense X Deployment'],
  focusAreas: ['CS Studies', 'Firmware', 'Storytelling']
}
```

---

## 8. Updating the Now Section

**File path**: `src/data/siteContent.ts`  
**Look for**: `NOW_CONTENT`

Update your active focus items:

```typescript
{
  id: 'cs-degree',
  category: 'Academic Focus',
  item: 'Computer Science Undergraduate Studies',
  detail: 'Sharpening core fundamentals: algorithms and discrete math.',
  status: 'In Progress'                      // 'In Progress' | 'Continuous' | 'Active Exploration'
}
```

---

## 9. Updating Basic Site Info

**File path**: `src/data/siteContent.ts`  
**Look for**: `SITE_INFO`

```typescript
export const SITE_INFO: SiteInfo = {
  brandName: 'AFRID',
  fullName: 'AFRID AHMED',
  shortRole: 'CS Undergraduate · 2030',
  fullRole: 'Computer Science Undergraduate · AI/ML Learner · Technology Creator · Builder',
  tagline: "BUILDING WHAT'S NEXT.",
  currentYear: '2026',
  graduationYear: '2030',
  email: 'afridaskar@gmail.com',
  location: 'Earth Orbit · Global'
};
```

---

## Summary of File Paths

| What you want to change | File to edit |
|---|---|
| **Hero & About Photos** | Replace files in `public/images/` (`afrid-hero.jpg`, `afrid-about.jpg`) |
| **Hero name, phrases, bio** | `src/data/siteContent.ts` (`HERO_CONTENT`) |
| **About bio, statement, skills** | `src/data/siteContent.ts` (`ABOUT_CONTENT`) |
| **Projects & sensor specs** | `src/data/siteContent.ts` (`PROJECTS`) |
| **YouTube videos & topics** | `src/data/siteContent.ts` (`CREATOR_CONTENT`) |
| **Milestones 2026–2030** | `src/data/siteContent.ts` (`JOURNEY`) |
| **Current priorities (Now)** | `src/data/siteContent.ts` (`NOW_CONTENT`) |
| **Social links & email** | `src/data/siteContent.ts` (`SOCIAL_LINKS` & `SITE_INFO`) |
