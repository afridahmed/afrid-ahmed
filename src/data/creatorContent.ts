/**
 * CREATOR / YOUTUBE CONTENT CONFIGURATION
 * 
 * To change any video:
 * Simply replace `youtubeUrl` and the corresponding `title` and `description`.
 * Exactly 1 Featured Video + 4 Additional Videos.
 */

export interface CreatorVideoItem {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  thumbnail?: string;
  duration: string;
  category: string;
  isFeatured?: boolean;
}

/**
 * 1. FEATURED FLAGSHIP VIDEO
 */
export const FEATURED_VIDEO: CreatorVideoItem = {
  id: 'vid-featured',
  title: 'Demystifying Edge AI: Running Neural Networks on Microcontrollers',
  description: 'An architectural walkthrough of deploying quantized neural network weights to low-power microcontrollers like the ESP32-S3 and understanding on-device edge inference.',
  youtubeUrl: 'https://youtube.com', // Replace with direct YouTube video or channel URL
  thumbnail: '',
  duration: '14:28',
  category: 'Edge AI & Systems',
  isFeatured: true
};

/**
 * 2. EXACTLY FOUR ADDITIONAL VIDEOS IN THE ARCHIVE
 */
export const ADDITIONAL_VIDEOS: CreatorVideoItem[] = [
  {
    id: 'vid-01',
    title: 'Building AquaSense X: From Raw Breadboard to Connected Telemetry',
    description: 'The end-to-end engineering journey: wiring analog sensors, writing C++ firmware filters, and building real-time telemetry streams.',
    youtubeUrl: 'https://youtube.com', // Replace with direct YouTube link
    thumbnail: '',
    duration: '18:45',
    category: 'Hardware & IoT'
  },
  {
    id: 'vid-02',
    title: 'The Modern Software Engineer Stack: 2026 Student Blueprint',
    description: 'Breaking down terminal workflows, TypeScript architecture, Git hygiene, and modern developer tooling for ambitious engineering students.',
    youtubeUrl: 'https://youtube.com', // Replace with direct YouTube link
    thumbnail: '',
    duration: '12:10',
    category: 'Software Engineering'
  },
  {
    id: 'vid-03',
    title: 'Apple Silicon, Unified Memory & Local AI Workflows',
    description: 'Why unified memory architecture changes local model execution and how silicon design influences software engineering today.',
    youtubeUrl: 'https://youtube.com', // Replace with direct YouTube link
    thumbnail: '',
    duration: '16:04',
    category: 'AI Architecture'
  },
  {
    id: 'vid-04',
    title: 'Automating Everything: Headless Micro-Scripts for Everyday Workflows',
    description: 'Practical automation tutorials using Bash, Python, and webhook triggers to eliminate friction from learning and building.',
    youtubeUrl: 'https://youtube.com', // Replace with direct YouTube link
    thumbnail: '',
    duration: '11:32',
    category: 'Workflow Automation'
  }
];

export const ALL_CREATOR_VIDEOS: CreatorVideoItem[] = [
  FEATURED_VIDEO,
  ...ADDITIONAL_VIDEOS
];
