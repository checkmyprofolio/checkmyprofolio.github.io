import { aboutMe, projects, skills } from './data';
import { identity, foundation, domains, featuredSystems, skillGroups, engineeringMethod } from './engineering-profile';
import { meeraModels, meeraCapabilities, meeraValidation } from './meeraai-content';
import { PORTFOLIO_LINKS, PORTFOLIO_ROUTES } from './portfolio-links';
const plain = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
export const privateProjectContext: Record<string, string> = {
  meeraai: 'Private engineering context: MeeraAI is Vidit\'s local-first desktop AI project and final-year engineering work. The broader development stack has included local GGUF inference, llama.cpp, QLoRA/LoRA experimentation, RAG, agentic tools, Electron/React UI, FastAPI/Python services, SQLite memory, Meera Browser, Playwright automation, document workflows, MCP, voice/TTS and speech recognition experiments. Voice work has included Qwen3-TTS and faster-whisper; multiple voice/performance iterations were developed. Training experiments included 4-bit NF4 QLoRA and mixed instruction/chat datasets such as OpenOrca, ShareGPT, Wikipedia, C4 samples, and UltraChat. This private context is descriptive project history, not a public performance guarantee.',
  aarnaai: 'Private engineering context: AarnaAI has included a Streamlit interface, ticker input, selectable periods from 1mo through 5y, LSTM experimentation, RandomForest classification, SMA9, RSI, MACD, Bollinger Bands, yfinance/IndianAPI.in data access, pandas/numpy/scikit-learn/pandas_ta/TensorFlow/Keras/plotly, and development variants AarnaAI-v1.0, AarnaAI-v2.0, and AarnaAI-Files. No API key or secret is part of the portfolio knowledge.',
  airlearn: 'Private project context: AIRLearn/AirLearn is an AI/Robotics learning platform concept with an AI chatbot and a Next.js/Firebase web stack.',
  'ai-cctv': 'Private project context: AI CCTV Surveillance explored computer-vision-based real-time industrial monitoring/analysis, including the Jyoti CNC problem context used during an Intel AI program.',
  'youtube-music-automation': 'Private project context: a Python automation tool with a custom GUI for YouTube Music workflows.',
  'iot-automation': 'Private project context: ESP32-based home/office automation connecting embedded inputs, control logic, and physical outputs.',
  'gemini-web2api': 'Private project context: Gemini Web2API is an API/integration engineering experiment around AI/web capabilities.',
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
 const specificProjectMention = /\b(?:meeraai|meera|aarnaai|aarna|airlearn|airlearn|cctv|surveillance|youtube music|music automation|iot|esp32|gemini web2api|gemini|web2api|omniroute|binance|futures testnet|profolio)\b/i.test(q);
 const allProjects = !specificProjectMention && (
   /\b(?:all|every|each|complete|entire|whole|full|list|catalog|collection|overview|portfolio)\b[\s\S]{0,80}\b(?:project|projects|work|things|built)\b/i.test(q)
   || /\b(?:project|projects|work)\b[\s\S]{0,80}\b(?:all|every|each|complete|entire|whole|full|list|catalog|collection|overview)\b/i.test(q)
   || /\b(?:what|which)\b[\s\S]{0,30}\b(?:have|has|did)\b[\s\S]{0,30}\b(?:built|created|made|worked on)\b/i.test(q)
   || /\b(?:tell|explain|describe)\b[\s\S]{0,30}\b(?:me|us)\b[\s\S]{0,30}\b(?:about|regarding)\b[\s\S]{0,30}\b(?:his|vidit['’]s|the)\b[\s\S]{0,20}\b(?:project|projects|work)\b/i.test(q)
 );

 if (allProjects) {
   const publicProjects = featuredSystems.filter((p) => p.visibility === 'public');
   const privateProjects = featuredSystems.filter((p) => p.visibility === 'private');
   const explorationProjects = featuredSystems.filter((p) => p.visibility === 'exploration');

   const renderProject = (p: FeaturedSystem) => {
     const lines = [
       `### ${p.title}`,
       `**Purpose:** ${p.problem}`,
       `**Approach:** ${p.approach}`,
       `**Architecture:** ${p.architecture}`,
       p.technologies.length ? `**Technologies:** ${p.technologies.join(', ')}` : '',
       `**Evidence / status:** ${p.evidence}`,
       p.limitations ? `**Limitations:** ${p.limitations}` : '',
     ].filter(Boolean);
     return lines.join('\n\n');
   };

   const publicSection = publicProjects.length
     ? `## Public projects 🌐\n\n${publicProjects.map(renderProject).join('\n\n---\n\n')}\n\n### Public project links 🔗\n${publicProjects.map((p) => p.source ? `- [${p.title} — GitHub](${p.source})` : '').filter(Boolean).join('\n')}`
     : '## Public projects 🌐\n\nNo public project repository is currently recorded.';

   const privateSection = privateProjects.length
     ? `## Private / personal projects 🔒\n\nThese are part of Vidit\'s project history but are **not presented as public source repositories** in the portfolio. The assistant should not invent or guess repository URLs.\n\n${privateProjects.map(renderProject).join('\n\n---\n\n')}`
     : '## Private / personal projects 🔒\n\nNo private projects are currently recorded in the portfolio context.';

   const explorationSection = explorationProjects.length
     ? `## Current exploration 🧪\n\n${explorationProjects.map(renderProject).join('\n\n---\n\n')}`
     : '';

   return `# Vidit\'s complete project portfolio 🚀\n\nVidit\'s portfolio contains public software projects, private/personal work, and ongoing engineering exploration. This catalog intentionally does not promote one project over the others.\n\n${publicSection}\n\n---\n\n${privateSection}${explorationSection ? `\n\n---\n\n${explorationSection}` : ''}`;
 }

 if (/meera|browser/.test(q) && /model|tier|lineup|quant/.test(q)) return meeraModels.map(m => `${m.name}: ${m.model}, ${m.parameters}, ${m.quantization} GGUF. Intended role: ${m.role}.${m.studioAlias ? ` Model Studio label: ${m.studioAlias}.` : ''}`).join('\n\n') + '\n\nThese are configured profiles, not seven independently evaluated releases. Model Studio lists different Max quantizations from the backend policy; recorded Qwen runs use IQ4_NL.';
 if (/meera|browser/.test(q) && /test|benchmark|verified|capabil/.test(q)) return meeraValidation.map(v => `${v.title}: ${v.text}`).join('\n\n');
 if (/browser/.test(q)) return meeraCapabilities.slice(2,4).map(c => `${c.title}: ${c.text} Status: ${c.status}.`).join('\n\n');
 const matched = projects.filter(p => {
  const name = p.title.startsWith('MeeraAI') ? 'meeraai' : p.title.startsWith('AarnaAI') ? 'aarnaai' : p.title.startsWith('Binance') ? 'binance' : p.title.toLowerCase();
  return new RegExp(`\\b${name}\\b`, 'i').test(q) || p.tags.some(t => q.includes(t.toLowerCase()));
 });
 if (/\b(?:who|about|introduce|introduction|tell me about|describe)\b/i.test(q) && !specificProjectMention && !/\b(?:project|projects)\b/i.test(q)) {
   return `# About Vidit Shah 👋

Vidit Shah is a Robotics & AI Engineer who completed a B.E. in Robotics & Automation in 2026 at Government Engineering College, Sector-28, Gandhinagar, under Gujarat Technological University (GTU), with a final CGPA of 8.45/10.

## Engineering focus 🧠
- Robotics, artificial intelligence and machine learning
- Computer vision, automation and control systems
- Local AI / LLM systems, software engineering and API integration
- Intelligent assistants, hardware-aware computing and system experimentation

## Project portfolio overview 🚀
Vidit's work includes public software projects as well as private/personal engineering projects. The project catalog is intentionally separated by visibility rather than presenting one project as the main one.

## Public profile links 🔗
- [GitHub profile](${portfolioFacts.contact.github})
- [LinkedIn profile](${portfolioFacts.contact.linkedin})
- [ORCID](${portfolioFacts.contact.orcid})

Private project source repositories are not linked unless the portfolio explicitly records them as public.`;
 }
 if (/contact|email|reach|linkedin/.test(q)) return `You can reach me at ${portfolioFacts.contact.email}, or visit ${portfolioFacts.contact.linkedin}.`;
 if (/cgpa|grade/.test(q)) return `I completed my B.E. in Robotics & Automation in 2026 with a final CGPA of ${identity.cgpa}, at ${identity.institution}, affiliated with ${identity.university}.`;
 if (/course|curriculum|foundation/.test(q)) return foundation.map(f => `${f.area}: ${f.courses.join(', ')}. ${f.meaning}`).join('\n\n');
 if (matched.length) return matched.map(p => { const system = featuredSystems.find(s => s.title === p.title); return `${p.title}: ${p.description} ${p.narrative} Evidence (${system?.level || 'Project brief'}): ${system?.evidence || ''} Limitations: ${system?.limitations || ''}${system?.source ? ' Source: ' + system.source : ''}`; }).join('\n\n');
 if (/project|work|built|build|portfolio/.test(q)) return portfolioAnswer('tell me about all projects');
 if (/skill|tech|python|stack/.test(q)) return `My listed skills include ${skills.join(', ')}. My projects span local AI inference, software integration, API experimentation, and intelligent-systems exploration.`;
 if (/education|degree|college|study|studying|graduat/.test(q)) return plain(aboutMe.bio);
 if (/hobb|interest|free time/.test(q)) return plain(aboutMe.hobbies);
 if (/goal|vision|future/.test(q)) return plain(aboutMe.goals);
 if (/experience|career|journey|accomplish/.test(q)) return plain(aboutMe.careerJourney);
 if (/who|about|vidit|yourself|introduc/.test(q)) return `I am ${aboutMe.name}, an ${aboutMe.title}. ${plain(aboutMe.bio).replace('I am a', 'As a').replace('I am an', 'As an')}`;
 return "I don't have a verified answer to that in the portfolio. Try asking about my projects, skills, education, experience, or how to contact me.";
}
