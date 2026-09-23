import { aboutMe, projects, skills } from './data';
import { identity, foundation, domains, featuredSystems, skillGroups, engineeringMethod } from './engineering-profile';
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
