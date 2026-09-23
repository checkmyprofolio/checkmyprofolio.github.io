import { aboutMe, projects, skills } from './data';
import { identity, foundation, domains, featuredSystems, skillGroups, engineeringMethod } from './engineering-profile';
import { meeraModels, meeraCapabilities, meeraValidation } from './meeraai-content';
import { PORTFOLIO_LINKS, PORTFOLIO_ORIGIN, PORTFOLIO_ROUTES } from './portfolio-links';
const plain = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
export const portfolioFacts = {
 ...Object.fromEntries(Object.entries(aboutMe).map(([key,value]) => [key,plain(value)])),
 identity, foundation, domains, featuredSystems, skillGroups, engineeringMethod,
 meeraAI: { models: meeraModels, capabilities: meeraCapabilities, validation: meeraValidation },
 skills,
 contact: { email: PORTFOLIO_LINKS.emailAddress, github: PORTFOLIO_LINKS.github, linkedin: PORTFOLIO_LINKS.linkedin, orcid: PORTFOLIO_LINKS.orcid, portfolio: PORTFOLIO_LINKS.portfolio },
 projects: projects.map(({title,description,narrative,tags,buildNotes,githubUrl,internalHref}) => ({title,description,narrative,tags,buildNotes,githubUrl: githubUrl === '#' ? undefined : githubUrl, page: internalHref})),
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
 if (/meera|browser/.test(q) && /model|tier|lineup|quant/.test(q)) return meeraModels.map(m => `${m.name}: ${m.model}, ${m.parameters}, ${m.quantization} GGUF. Intended role: ${m.role}.${m.studioAlias ? ` Model Studio label: ${m.studioAlias}.` : ''}`).join('\n\n') + '\n\nThese are configured profiles, not seven independently evaluated releases. Model Studio lists different Max quantizations from the backend policy; recorded Qwen runs use IQ4_NL.';
 if (/meera|browser/.test(q) && /test|benchmark|verified|capabil/.test(q)) return meeraValidation.map(v => `${v.title}: ${v.text}`).join('\n\n');
 if (/browser/.test(q)) return meeraCapabilities.slice(2,4).map(c => `${c.title}: ${c.text} Status: ${c.status}.`).join('\n\n');
 const matched = projects.filter(p => {
  const name = p.title.startsWith('MeeraAI') ? 'meeraai' : p.title.startsWith('AarnaAI') ? 'aarnaai' : p.title.startsWith('Binance') ? 'binance' : p.title.toLowerCase();
  return new RegExp(`\\b${name}\\b`, 'i').test(q) || p.tags.some(t => q.includes(t.toLowerCase()));
 });
 if (/contact|email|reach|linkedin/.test(q)) return `You can reach me at ${portfolioFacts.contact.email}, or visit ${portfolioFacts.contact.linkedin}.`;
 if (/cgpa|grade/.test(q)) return `I completed my B.E. in Robotics & Automation in 2026 with a final CGPA of ${identity.cgpa}, at ${identity.institution}, affiliated with ${identity.university}.`;
 if (/course|curriculum|foundation/.test(q)) return foundation.map(f => `${f.area}: ${f.courses.join(', ')}. ${f.meaning}`).join('\n\n');
 if (matched.length) return matched.map(p => { const system = featuredSystems.filter(s => s.level !== 'Current exploration')[p.id - 1]; return `${p.title}: ${p.description} ${p.narrative} Evidence (${system.level}): ${system.evidence} Limitations: ${system.limitations}${system.source ? ' Source: ' + system.source : ''}`; }).join('\n\n');
 if (/project|work|built|build|portfolio/.test(q)) return `My portfolio includes:\n\n${projects.map(p => `${p.title}: ${p.description}`).join('\n\n')}`;
 if (/skill|tech|python|stack/.test(q)) return `My listed skills include ${skills.join(', ')}. My projects span local AI inference, software integration, API experimentation, and intelligent-systems exploration.`;
 if (/education|degree|college|study|studying|graduat/.test(q)) return plain(aboutMe.bio);
 if (/hobb|interest|free time/.test(q)) return plain(aboutMe.hobbies);
 if (/goal|vision|future/.test(q)) return plain(aboutMe.goals);
 if (/experience|career|journey|accomplish/.test(q)) return plain(aboutMe.careerJourney);
 if (/who|about|vidit|yourself|introduc/.test(q)) return `I am ${aboutMe.name}, an ${aboutMe.title}. ${plain(aboutMe.bio).replace('I am a', 'As a').replace('I am an', 'As an')}`;
 return "I don't have a verified answer to that in the portfolio. Try asking about my projects, skills, education, experience, or how to contact me.";
}
