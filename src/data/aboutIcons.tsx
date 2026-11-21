import React from 'react';
import {
  BrainCircuit,
  Cloud,
  ShieldCheck,
  Workflow,
  Terminal,
  Code2,
  Cpu,
  Database,
  Globe,
  Youtube,
  Video,
  Briefcase,
  Lightbulb,
  Rocket,
  GraduationCap,
  Award,
  BookOpen,
  Compass,
  Layers,
  Sparkles,
  Zap,
  Lock,
  Server,
  Bot,
  Palette,
  LucideIcon,
} from 'lucide-react';

export interface AboutIconOption {
  name: string;
  label: string;
  category: 'Tech' | 'Academic' | 'Creator' | 'Business';
  icon: LucideIcon;
}

export const ABOUT_ICON_OPTIONS: AboutIconOption[] = [
  { name: 'BrainCircuit', label: 'AI / Neural', category: 'Tech', icon: BrainCircuit },
  { name: 'Cloud', label: 'Cloud', category: 'Tech', icon: Cloud },
  { name: 'ShieldCheck', label: 'Security', category: 'Tech', icon: ShieldCheck },
  { name: 'Workflow', label: 'Automation', category: 'Tech', icon: Workflow },
  { name: 'Terminal', label: 'Terminal / Code', category: 'Tech', icon: Terminal },
  { name: 'Code2', label: 'Programming', category: 'Tech', icon: Code2 },
  { name: 'Cpu', label: 'Hardware / Embedded', category: 'Tech', icon: Cpu },
  { name: 'Bot', label: 'Robotics / Agents', category: 'Tech', icon: Bot },
  { name: 'Database', label: 'Data / SQL', category: 'Tech', icon: Database },
  { name: 'Server', label: 'Systems', category: 'Tech', icon: Server },
  { name: 'Lock', label: 'Privacy / Cyber', category: 'Tech', icon: Lock },
  { name: 'Globe', label: 'Web / Global', category: 'Tech', icon: Globe },
  { name: 'Youtube', label: 'YouTube', category: 'Creator', icon: Youtube },
  { name: 'Video', label: 'Video / Media', category: 'Creator', icon: Video },
  { name: 'Palette', label: 'Creative Design', category: 'Creator', icon: Palette },
  { name: 'Briefcase', label: 'Business / Work', category: 'Business', icon: Briefcase },
  { name: 'Lightbulb', label: 'Innovation', category: 'Business', icon: Lightbulb },
  { name: 'Rocket', label: 'Launch / Venture', category: 'Business', icon: Rocket },
  { name: 'Zap', label: 'Speed / Impact', category: 'Business', icon: Zap },
  { name: 'GraduationCap', label: 'Education / Degree', category: 'Academic', icon: GraduationCap },
  { name: 'BookOpen', label: 'Research / Study', category: 'Academic', icon: BookOpen },
  { name: 'Award', label: 'Achievement', category: 'Academic', icon: Award },
  { name: 'Compass', label: 'Direction', category: 'Academic', icon: Compass },
  { name: 'Layers', label: 'Architecture', category: 'Tech', icon: Layers },
  { name: 'Sparkles', label: 'Featured', category: 'Creator', icon: Sparkles },
];

export const ABOUT_ICON_MAP: Record<string, LucideIcon> = ABOUT_ICON_OPTIONS.reduce(
  (acc, item) => {
    acc[item.name] = item.icon;
    return acc;
  },
  {} as Record<string, LucideIcon>
);

export function getAboutIcon(iconName?: string, fallback: LucideIcon = Sparkles): LucideIcon {
  if (!iconName) return fallback;
  return ABOUT_ICON_MAP[iconName] || fallback;
}

export const AboutDynamicIcon: React.FC<{
  name?: string;
  className?: string;
  fallback?: LucideIcon;
}> = ({ name, className = 'w-4 h-4', fallback = Sparkles }) => {
  const IconComp = getAboutIcon(name, fallback);
  return <IconComp className={className} aria-hidden="true" />;
};
