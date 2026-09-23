import { aboutMe, projects, skills } from './data';
import { identity, foundation, domains, featuredSystems, skillGroups, engineeringMethod, type FeaturedSystem } from './engineering-profile';
import { meeraModels, meeraCapabilities, meeraValidation } from './meeraai-content';
import { PORTFOLIO_LINKS, PORTFOLIO_ORIGIN, PORTFOLIO_ROUTES } from './portfolio-links';
const plain = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
export const privateProjectContext: Record<string, string> = {
  meeraai: 'Private engineering context: MeeraAI is Vidit\'s local-first desktop AI project and final-year engineering work. The broader development stack has included local GGUF inference, llama.cpp, QLoRA/LoRA experimentation, RAG, agentic tools, Electron/React UI, FastAPI/Python services, SQLite memory, Meera Browser, Playwright automation, document workflows, MCP, voice/TTS and speech recognition experiments. Voice work has included Qwen3-TTS and faster-whisper; multiple voice/performance iterations were developed. Training experiments included 4-bit NF4 QLoRA and mixed instruction/chat datasets such as OpenOrca, ShareGPT, Wikipedia, C4 samples, and UltraChat. This private context is descriptive project history, not a public performance guarantee.',
  aarnaai: 'Private engineering context: AarnaAI has included private repositories `AarnaAI-v1.0`, `AarnaAI-v2.0`, and `AarnaAI-Files`. The project has included a Streamlit interface, ticker input, selectable periods from 1mo through 5y, LSTM experimentation, RandomForest classification, SMA9, RSI, MACD, Bollinger Bands, yfinance/IndianAPI.in data access, pandas/numpy/scikit-learn/pandas_ta/TensorFlow/Keras/plotly, and development variants AarnaAI-v1.0, AarnaAI-v2.0, and AarnaAI-Files. No API key or secret is part of the portfolio knowledge.',
  airlearn: 'Private project context: AIRLearn/AirLearn is an AI/Robotics learning platform concept with an AI chatbot and a Next.js/Firebase web stack.',
  'ai-cctv': 'Private project context: AI CCTV Surveillance explored computer-vision-based real-time industrial monitoring/analysis, including the Jyoti CNC problem context used during an Intel AI program.',
  'youtube-music-automation': 'Private project context: a Python automation tool with a custom GUI for YouTube Music workflows.',
  'iot-automation': 'Private project context: ESP32-based home/office automation connecting embedded inputs, control logic, and physical outputs.',
  'gemini-web2api': 'Public project context: Gemini Web2API is implemented in the public Infera repository as a unified AI gateway and protocol-translation layer.',
  omniroute: 'Private/ongoing project context: OmniRoute is an active software project. Public technical details are intentionally limited until its implementation is documented for the portfolio.',
};

export const portfolioFacts = {
 ...Object.fromEntries(Object.entries(aboutMe).map(([key,value]) => [key,plain(value)])),
 identity, foundation, domains, featuredSystems, skillGroups, engineeringMethod,
 meeraAI: { models: meeraModels, capabilities: meeraCapabilities, validation: meeraValidation },
 skills,
 contact: { email: PORTFOLIO_LINKS.emailAddress, github: PORTFOLIO_LINKS.github, linkedin: PORTFOLIO_LINKS.linkedin, orcid: PORTFOLIO_LINKS.orcid, portfolio: PORTFOLIO_LINKS.portfolio },
 projects: projects.map(({title,description,narrative,tags,buildNotes,githubUrl,internalHref,visibility}) => ({title,description,narrative,tags,buildNotes,visibility,githubUrl: githubUrl === '#' ? undefined : githubUrl, page: internalHref})),
  navigation: [
    { label: 'Home', path: PORTFOLIO_ROUTES.home, description: 'Landing page with Vidit\'s engineering introduction.' },
    { label: 'Overview', path: PORTFOLIO_ROUTES.dashboard, description: 'Engineering dashboard with deeper profile, skills, coursework, evidence, and methods.' },
    { label: 'Projects', path: PORTFOLIO_ROUTES.projects, description: 'Project index with walkthroughs and source links where public evidence exists.' },
    { label: 'Contact', path: PORTFOLIO_ROUTES.contact, description: 'Contact form and direct email fallback.' },
    { label: 'Profile', path: PORTFOLIO_ROUTES.profile, description: 'Profile view for Vidit.' },
    { label: 'MeeraAI', path: PORTFOLIO_ROUTES.meeraAI, description: 'Detailed MeeraAI and Meera Browser walkthrough.' },
  ],
  links: PORTFOLIO_LINKS,
};
export function portfolioAnswer(question: string) {
 const q = question.toLowerCase();

 const aliases: Record<string, string[]> = {
   meeraai: ['meeraai', 'meera browser', 'desktop assistant'],
   aarnaai: ['aarnaai', 'aarna ai'],
   airlearn: ['airlearn', 'air learn', 'airlearn platform'],
   'ai-cctv': ['ai cctv', 'cctv surveillance', 'cctv', 'surveillance'],
   'youtube-music-automation': ['youtube music automation', 'music automation'],
   'iot-automation': ['iot', 'esp32', 'home office automation', 'home automation'],
   'gemini-web2api': ['gemini web2api', 'infera', 'web2api'],
   omniroute: ['omniroute', 'omni route'],
   'binance-cli': ['binance futures', 'futures testnet', 'binance cli', 'trading bot'],
   profolio: ['profolio', 'portfolio website', 'portfolio site'],
   aerosynth3d: ['aerosynth', 'aerosynth 3d', 'single-pass', 'single pass 3d', 'drone reconstruction', 'photogrammetry'],
 };

 const matchesProject = (p: FeaturedSystem) => {
   const title = p.title.toLowerCase();
   return aliases[p.id]?.some((alias) => q.includes(alias))
     || q.includes(p.id.toLowerCase())
     || q.includes(title);
 };

 const specificProject = featuredSystems.find(matchesProject);
 const asksForAllProjects = !specificProject && (
   /\b(?:all|every|each|complete|entire|whole|full|list|catalog|collection|overview|portfolio)\b[\s\S]{0,100}\b(?:project|projects|work|things|built|created|made)\b/i.test(q) ||
   /\b(?:project|projects|work)\b[\s\S]{0,100}\b(?:all|every|each|complete|entire|whole|full|list|catalog|collection|overview|portfolio)\b/i.test(q) ||
   /\b(?:what|which)\b[\s\S]{0,40}\b(?:have|has|did)\b[\s\S]{0,40}\b(?:built|created|made|worked on)\b/i.test(q) ||
   /\b(?:tell|explain|describe|show)\b[\s\S]{0,50}\b(?:me|us)\b[\s\S]{0,50}\b(?:his|vidit['’]s|the)\b[\s\S]{0,30}\b(?:project|projects|work|portfolio)\b/i.test(q)
 );

 const renderProject = (p: FeaturedSystem, number: number) => {
   const status = p.visibility === 'public' ? 'PUBLIC — source available' : p.visibility === 'private' ? 'PRIVATE / PERSONAL — source not publicly linked' : 'EXPLORATION / RESEARCH DIRECTION';
   const lines = [
     `### ${String(number).padStart(2, '0')} — ${p.title}`,
     `**Visibility:** ${status}`,
     `**Purpose:** ${p.problem}`,
     `**Approach:** ${p.approach}`,
     `**Architecture:** ${p.architecture}`,
     `**Technology:** ${p.technologies.join(', ')}`,
     `**Engineering decisions:** ${p.decisions}`,
     `**Evidence / status:** ${p.evidence}`,
     p.limitations ? `**Limitations:** ${p.limitations}` : '',
   ].filter(Boolean);
   return lines.join('\n\n');
 };

 const linksFor = (items: FeaturedSystem[]) => items.flatMap((p) => {
   const links: string[] = [];
   if (p.source) links.push(`- [${p.title} — GitHub](${p.source})`);
   if (p.liveUrl) links.push(`- [${p.title} — live site](${p.liveUrl})`);
   if (p.page) links.push(`- [${p.title} — portfolio walkthrough](${PORTFOLIO_ORIGIN}${p.page})`);
   return links;
 });

 if (asksForAllProjects) {
   const publicProjects = featuredSystems.filter((p) => p.visibility === 'public');
   const privateProjects = featuredSystems.filter((p) => p.visibility === 'private');
   const explorationProjects = featuredSystems.filter((p) => p.visibility === 'exploration');
   let number = 1;
   return [
     '# Vidit’s Complete Project Portfolio 🚀',
     'Vidit’s work is intentionally split into **public projects**, **private/personal projects**, and **current exploration**. This catalog does not rank or promote one project over another. A repository link appears only when that repository is actually public and verified.',
     '## Public projects 🌐',
     publicProjects.map((p) => renderProject(p, number++)).join('\n\n---\n\n'),
     '### Public project links 🔗',
     linksFor(publicProjects).join('\n'),
     '## Private / personal projects 🔒',
     'These projects are part of Vidit’s engineering work, but their source repositories are private or are not publicly linked. The assistant must **not fabricate GitHub URLs** for them.',
     privateProjects.map((p) => renderProject(p, number++)).join('\n\n---\n\n'),
     '## Current exploration 🧪',
     explorationProjects.length ? explorationProjects.map((p) => renderProject(p, number++)).join('\n\n---\n\n') : 'No separate exploration item is currently recorded.',
   ].filter(Boolean).join('\n\n');
 }

 if (/meera|browser/.test(q) && /model|tier|lineup|quant/.test(q)) {
   return `# MeeraAI model lineup 🧠\n\n${meeraModels.map((m) => `**${m.name}** — ${m.model}; ${m.parameters}; ${m.quantization} GGUF. Intended role: ${m.role}.${m.studioAlias ? ` Model Studio label: ${m.studioAlias}.` : ''}`).join('\n\n')}\n\nThese are configured profiles, not seven independently benchmarked releases.`;
 }

 if (/meera|browser/.test(q) && /test|benchmark|verified|validation|capabil/.test(q)) {
   return `# MeeraAI validation & capabilities 🧪\n\n${meeraValidation.map((v) => `**${v.title}:** ${v.text}`).join('\n\n')}`;
 }

 if (specificProject) {
   const p = specificProject;
   const extra = privateProjectContext[p.id];
   const links = linksFor([p]);
   return [
     `# ${p.title} 🚀`,
     `**Visibility:** ${p.visibility === 'public' ? 'PUBLIC' : p.visibility === 'private' ? 'PRIVATE / PERSONAL' : 'EXPLORATION'}`,
     `**Purpose:** ${p.problem}`,
     `**Approach:** ${p.approach}`,
     `**Architecture:** ${p.architecture}`,
     `**Technology:** ${p.technologies.join(', ')}`,
     `**Engineering decisions:** ${p.decisions}`,
     `**Evidence / status:** ${p.evidence}`,
     p.limitations ? `**Limitations:** ${p.limitations}` : '',
     extra ? `**Additional project context:** ${extra}` : '',
     links.length ? `## Verified links 🔗\n${links.join('\n')}` : p.visibility === 'private' ? '## Source access 🔒\nThe project source is private/not publicly linked; no GitHub repository URL is provided.' : '',
   ].filter(Boolean).join('\n\n');
 }

 if (/contact|email|reach|linkedin|orcid/.test(q)) {
   return `# Contact & public profiles 🔗\n\n- **Email:** ${portfolioFacts.contact.email}\n- **GitHub:** [${portfolioFacts.contact.github}](${portfolioFacts.contact.github})\n- **LinkedIn:** [${portfolioFacts.contact.linkedin}](${portfolioFacts.contact.linkedin})\n- **ORCID:** [${portfolioFacts.contact.orcid}](${portfolioFacts.contact.orcid})`;
 }

 if (/cgpa|grade|graduat|degree|college|university|education/.test(q)) {
   return `# Education 🎓\n\n**Degree:** ${identity.degree}\n\n**Institution:** ${identity.institution}\n\n**University:** ${identity.university}\n\n**Intake:** ${identity.intake}\n\n**Graduation:** ${identity.graduation}\n\n**Final CGPA:** ${identity.cgpa}\n\n${foundation.map((f) => `**${f.area}:** ${f.courses.join(', ')} — ${f.meaning}`).join('\n\n')}`;
 }

 if (/skill|stack|technology|technologies|technical/.test(q)) {
   return `# Engineering skills 💻\n\n${skillGroups.map((group) => `**${group.name}:** ${group.items.map((item) => item[0]).join(', ')}`).join('\n\n')}\n\n**Cross-domain foundation:** Robotics, automatic control, machine vision, microcontrollers & PLC, numerical methods, mathematics, and soft computing.`;
 }

 if (/project|work|built|build|portfolio/.test(q)) return portfolioAnswer('tell me about all projects');
 if (/hobb|interest|free time/.test(q)) return plain(aboutMe.hobbies);
 if (/goal|vision|future/.test(q)) return plain(aboutMe.goals);
 if (/experience|career|journey|accomplish/.test(q)) return plain(aboutMe.careerJourney);
 if (/who|about|vidit|yourself|introduc/.test(q)) return `# About Vidit Shah 👋\n\nVidit Shah is a Robotics & AI Engineer. ${plain(aboutMe.bio)}`;
 return "I don't have a verified answer to that in the portfolio knowledge base. Try asking about a project, the complete project portfolio, skills, education, or contact details.";
}