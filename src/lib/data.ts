
import type { ImagePlaceholder } from './placeholder-images';
import { PlaceHolderImages } from './placeholder-images';
import { identity, featuredSystems } from './engineering-profile';


const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id);

export const avatarImage = getImage('avatar');

const meeraaiProjectImage = {
  id: 'meeraai-dashboard',
  description: 'MeeraAI main workspace with the prompt composer',
  imageUrl: '/meeraai/screenshots/workspace.png',
  imageHint: 'ai welcome interface',
};

export type ProjectMetric = {
  value: string;
  label: string;
};

export type Project = {
  id: number;
  title: string;
  eyebrow: string;
  description: string;
  headline: string;
  narrative: string;
  atmosphere: string;
  status: string;
  year: string;
  image?: ImagePlaceholder;
  tags: string[];
  metrics: ProjectMetric[];
  buildNotes: string[];
  visibility?: 'public' | 'private' | 'exploration';
  liveUrl?: string;
  githubUrl?: string;
  internalHref?: string;

  ctaLabel?: string;
  backdrop: string;
  glow: string;
};

export const projects: Project[] = featuredSystems.filter(system => system.level !== 'Current exploration').map((system, index) => ({
  id: index + 1,
  title: system.title,
  eyebrow: `${String(index + 1).padStart(2, '0')} / ${system.categories.join(' / ')}`,
  description: system.problem,
  headline: system.approach,
  narrative: system.architecture,
  atmosphere: system.limitations,
  status: system.level === 'Public project' ? 'Public source available' : system.level === 'Source reviewed' ? 'Local source reviewed / 22 tests passed' : 'Project description',
  year: '',
  image: system.id === 'meeraai' ? meeraaiProjectImage : getImage(`project-${index % 4 + 1}`),
  tags: system.technologies.length ? system.technologies : system.categories,
  metrics: system.id === 'meeraai' ? [{value:'7',label:'curated GGUF profiles'},{value:'22',label:'regression checks passed'},{value:'2',label:'browser layers'}] : [],
  buildNotes: [`Decision: ${system.decisions}`, `Evidence: ${system.evidence}`, `Limitations: ${system.limitations}`, `Proposed next step: ${system.nextStep}`],
  visibility: system.visibility,
  githubUrl: system.source,
  internalHref: system.page,
  ctaLabel: system.page ? 'View walkthrough' : undefined,
  backdrop: 'linear-gradient(135deg, rgba(14,165,233,0.28), rgba(15,23,42,0.92) 38%, rgba(132,204,22,0.18))',
  glow: 'rgba(56, 189, 248, 0.45)',
}));

// Flat summary retained for the existing About dialog; detailed evidence is on /dashboard.
export const skills = ['Python (public CLI)', 'TypeScript / JavaScript (portfolio)', 'Robotics (coursework)', 'Control systems (coursework)', 'Machine vision (coursework)', 'Microcontrollers & PLC (coursework)', 'Soft Computing (coursework)', 'Local AI (project direction)'];
export const aboutMe = {
  name: identity.name,
  title: identity.title,
  bio: `<p class="mb-4">I am a Robotics &amp; AI Engineer and a graduate of ${identity.institution}, affiliated with ${identity.university}. I completed my B.E. in Robotics &amp; Automation in 2026 (2022 intake), with a final CGPA of ${identity.cgpa}.</p><p>${identity.statement} My experience is project-based, supported by interdisciplinary engineering coursework.</p>`,
  careerJourney: '<p>My academic foundation spans programming, mathematics, numerical methods, robotics, control, machine vision, microcontrollers &amp; PLC, and soft computing. My project work includes local AI development, a public Python Testnet CLI, API experimentation, and portfolio systems. No employment or internship history is claimed here.</p>',
  accomplishments: '<p>Completed B.E. in Robotics &amp; Automation, GTU, with 8.45/10 CGPA. Public software evidence includes the Binance Futures Testnet CLI; other supplied project directions include MeeraAI, AarnaAI, and gemini-web2api. No publication, award, benchmark, or commercial deployment is claimed.</p>',
  hobbies: '<p>My current technical interests connect intelligent systems, robotics, computer vision, local AI, intelligent assistants, automation, hardware-aware inference, software architecture, and system integration.</p>',
  goals: '<p>Future direction: intelligent autonomous systems that combine perception, AI, planning, control, local intelligence, and automation. This is an ambition, not a completed deployment.</p>',
};
