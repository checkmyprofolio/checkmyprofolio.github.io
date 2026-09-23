// Biography and coursework supplied by Vidit in the September 2026 portfolio brief.
// Public evidence checked without credentials on 2026-09-15. MeeraAI local source was reviewed with owner authorization.
import { meeraSummary } from './meeraai-content';
export const identity = {
 name: 'Vidit Shah', title: 'Robotics & AI Engineer',
 statement: 'I work on robotics, AI applications, computer vision, automation, and software.',
 degree: 'B.E. in Robotics & Automation', university: 'Gujarat Technological University (GTU)',
 institution: 'Government Engineering College, Sector-28, Gandhinagar', intake: 2022, graduation: 2026, cgpa: '8.45 / 10',
 github: 'https://github.com/viditshah5656', linkedin: 'https://www.linkedin.com/in/viditshah5656/', orcid: 'https://orcid.org/0009-0009-0658-6157', email: 'viditshah5656@gmail.com',
};
export const foundation = [
 {area:'Programming', courses:['Programming for Problem Solving'], meaning:'This course introduced me to programming and breaking a problem into steps that can be implemented in code.'},
 {area:'Mathematics & computation', courses:['Mathematics I','Mathematics II','Complex Variables & Partial Differential Equations','Numerical Methods'], meaning:'These courses covered the mathematics used to model engineering problems and calculate solutions, including numerical methods when an exact answer is difficult to find.'},
 {area:'Control & automation', courses:['Automatic Control Systems','Microcontrollers & PLC'], meaning:'I studied feedback and control, along with how microcontrollers and PLCs are used to automate physical processes.'},
 {area:'Robotics', courses:['Principles of Robotics'], meaning:'This course covered robotics fundamentals and helped me understand how sensing, motion, and control fit together.'},
 {area:'Perception', courses:['Machine Vision Systems'], meaning:'I studied how images are captured and processed so a machine can use visual information.'},
 {area:'Intelligent computation', courses:['Soft Computing'], meaning:'Soft Computing introduced me to approaches used in computational intelligence, alongside the programming and mathematics in my degree.'},
];
export type EvidenceLevel = 'Public project' | 'Source reviewed' | 'Project brief' | 'Current exploration';
export type FeaturedSystem = {
 id:string; title:string; categories:string[]; level:EvidenceLevel; problem:string; approach:string; architecture:string; technologies:string[]; decisions:string; evidence:string; limitations:string; nextStep:string; source?:string; page?:string;
};
export const featuredSystems: FeaturedSystem[] = [
 {id:'meeraai', title:'MeeraAI / Desktop Assistant & Meera Browser', categories:['AI / ML','Local AI','Software systems','Automation'], level:'Source reviewed',
  ...meeraSummary, technologies:['Python','FastAPI','TypeScript','React','Electron','GGUF','llama.cpp','Playwright','SQLite','MCP','RAG'], page:'/meeraai'},
 {id:'binance-cli',title:'Binance Futures Testnet CLI',categories:['Software systems','Automation'],level:'Public project',
 problem:'Translate a CLI order request into a validated, signed testnet request while preserving uncertainty about remote outcomes.',
 approach:'Python CLI with separate validation, order translation, signed REST transport, and exception boundaries.',
 architecture:'CLI -> validation -> order logic -> signed REST client -> transport -> client observation.',
 technologies:['Python','Click','HMAC-SHA256','pytest','REST'],
 decisions:'Reject invalid input before transport; distinguish API rejection from a network outcome that cannot be confirmed.',
 evidence:'Public source and README describe mocked tests and testnet runs. These are repository-reported results, not rerun by this portfolio.',
 limitations:'Testnet only. A missing response cannot establish remote state. This is not a live-trading or financial-performance claim.',
 nextStep:'Make reconciliation of unknown outcomes an explicit review topic before extending automation.',source:'https://github.com/viditshah5656/binance-futures-trading-bot'},
 {id:'aarnaai',title:'AarnaAI development',categories:['AI / ML','Experimental / R&D'],level:'Project brief',
 problem:'AI system development and experimentation; a narrower problem statement has not been supplied.',
 approach:'Development history includes AarnaAI-v1.0, AarnaAI-v2.0, and AarnaAI-Files.',
 architecture:'Not publicly documented in the evidence available for this page.',technologies:[],
 decisions:'Keep version history separate from claims about model architecture or performance.',
 evidence:'Project names and broad AI direction supplied by Vidit. Public implementation was not available at the evidence check.',
 limitations:'Capabilities, datasets, training methods, and results are not established. No stock-prediction claim is made.',
 nextStep:'Provide a shareable problem statement and version-specific technical notes.'},
 {id:'gemini-web2api',title:'gemini-web2api',categories:['Software systems','Experimental / R&D'],level:'Project brief',
 problem:'Software/API experimentation; the precise contract and intended use are not publicly documented here.',
 approach:'API and AI systems experimentation, as described in the project brief.',architecture:'Implementation and request flow have not been supplied for public review.',technologies:[],
 decisions:'Document interfaces and failure boundaries before presenting capability claims.',
 evidence:'Project name supplied by Vidit; no public repository was visible at the evidence check.',
 limitations:'No claims about scale, users, deployment status, or implementation language.',nextStep:'Publish API boundaries, reproducible examples, and limitations.'},
 {id:'profolio',title:'Profolio',categories:['Software systems'],level:'Project brief',
 problem:'Make engineering background, project evidence, and contact paths accessible without visitor accounts.',
 approach:'A public portfolio with project pages, a contact form, and a facts-grounded chat interface.',architecture:'Next.js pages and React components; server-side chat route with portfolio context and optional model inference.',
 technologies:['TypeScript','JavaScript','React','Next.js','REST'],
 decisions:'Keep model credentials server-side and label portfolio fallback answers separately from model responses.',
 evidence:'The application and its TypeScript source are available in this workspace. Contact uses Formspree; chat has an optional model endpoint.',
 limitations:'Live inference requires a configured model server. Contact delivery depends on an active Formspree recipient.',
 nextStep:'Keep biography and project evidence synchronized and validate external integrations.'},
 {id:'vision-robotics',title:'Robotics & computer vision exploration',categories:['Robotics','Computer vision','Experimental / R&D'],level:'Current exploration',
 problem:'Connect perception and reasoning to planning, control, action, and feedback.',
 approach:'Study the complete intelligent-systems loop, grounded in robotics, control, and machine-vision coursework.',
 architecture:'Conceptual pipeline: camera/data -> preprocessing -> perception -> features/objects -> reasoning -> decision -> action/feedback.',technologies:['Machine Vision Systems coursework','Principles of Robotics coursework','Automatic Control Systems coursework'],
 decisions:'Treat vision as system input rather than an isolated model call; evaluate how decisions affect downstream action.',
 evidence:'Academic subjects and current interests supplied by Vidit. No public robot implementation or vision experiment is linked.',
 limitations:'An exploration direction, not a completed autonomous robot deployment. No detector, dataset, accuracy, or FPS is claimed.',
 nextStep:'Document a small reproducible sensing-to-action experiment with explicit measurements.'},
];
export const domains = [
 {name:'Robotics',work:'I am interested in how robots sense their surroundings, plan actions, and use control systems to carry them out.',academic:'Principles of Robotics; Automatic Control Systems',systems:['vision-robotics'],tech:'Robotics fundamentals (coursework)',evidence:'Degree coursework and current interests',future:'Build a small robotics experiment that connects sensing to action and can be tested repeatedly.'},
 {name:'Artificial intelligence',work:'I work on integrating AI models into applications that people can use.',academic:'Soft Computing; Programming for Problem Solving',systems:['meeraai','aarnaai'],tech:'Model integration; local inference (project direction)',evidence:'AI application work and degree coursework',future:'Explore how AI can help a system interpret sensor data and choose an action.'},
 {name:'Machine learning',work:'I am interested in training and evaluating models, and understanding when their predictions are useful.',academic:'Soft Computing; mathematics; Numerical Methods',systems:['aarnaai'],tech:'ML / deep learning (current interests; no framework claim)',evidence:'Degree coursework and ongoing exploration',future:'Compare models against a clear baseline and document how their results were evaluated.'},
 {name:'Computer vision',work:'I am interested in using image data to help software understand a scene and make a decision.',academic:'Machine Vision Systems',systems:['vision-robotics'],tech:'Machine vision (coursework); image processing (exploration)',evidence:'Degree coursework and current interests',future:'Test how the output of a vision model can be used in a larger application.'},
 {name:'Automation',work:'My coursework covered physical automation. I also use software to automate tasks and workflows.',academic:'Microcontrollers & PLC; Automatic Control Systems',systems:['binance-cli','vision-robotics'],tech:'PLC / microcontrollers (coursework); Python CLI (public project)',evidence:'Degree coursework and software projects',future:'Build automation that is easy to monitor and handles errors clearly.'},
 {name:'Control systems',work:'I studied feedback control and am interested in how a system adjusts its actions based on the result.',academic:'Automatic Control Systems',systems:['vision-robotics'],tech:'Feedback and control (coursework)',evidence:'Studied in my degree; practical control work is an interest',future:'Explore control experiments that use information from sensors or cameras.'},
 {name:'Local AI / LLM systems',work:'I work on local AI applications, including model loading, inference, memory constraints, and user interfaces.',academic:'Programming; numerical computation',systems:['meeraai'],tech:'Local inference; quantization (project direction)',evidence:'Local AI application development',future:'Test local models on specific hardware and share the setup and measurements.'},
 {name:'Intelligent agents',work:'I am exploring assistants that can use tools and carry out actions through software.',academic:'Soft Computing; programming',systems:['meeraai'],tech:'Assistant interaction and orchestration (exploration)',evidence:'Assistant development and ongoing exploration',future:'Make tool inputs, outputs, and error handling clear before adding more actions.'},
 {name:'Software engineering',work:'I build applications with separate modules, input validation, error handling, and tests.',academic:'Programming for Problem Solving',systems:['binance-cli','profolio'],tech:'Python; TypeScript; React; Next.js',evidence:'Python and web application projects',future:'Write clearer setup instructions and explain the decisions behind the code.'},
 {name:'API / systems integration',work:'I work with APIs and pay attention to how requests are validated, sent, and handled when something goes wrong.',academic:'Programming; numerical computation',systems:['binance-cli','gemini-web2api','profolio'],tech:'REST; signed requests; API interfaces',evidence:'API integration and software experimentation',future:'Handle cases where a request times out and it is unclear whether the server completed it.'},
 {name:'Hardware-aware computing',work:'I am interested in how available memory and hardware affect the way an AI application runs locally.',academic:'Microcontrollers & PLC; Numerical Methods',systems:['meeraai'],tech:'Quantization and model handling (project direction)',evidence:'Local AI development; hardware testing is a next step',future:'Measure memory use and runtime behavior on a documented hardware setup.'},
 {name:'Experimentation & verification',work:'I use tests and debugging to check assumptions, find failures, and understand how software behaves.',academic:'Numerical Methods; programming',systems:['binance-cli','profolio'],tech:'pytest (public CLI); TypeScript validation (portfolio)',evidence:'Tests, documentation, and application checks',future:'Keep notes on what was tested, what failed, and what changed afterward.'},
];
export const skillGroups = [
 {name:'Programming',items:[['Python','Public CLI project'],['JavaScript / TypeScript','Portfolio workspace']]},
 {name:'AI / ML',items:[['Local inference, model handling, quantization','MeeraAI project direction'],['ML, deep learning, intelligent agents','Current exploration'],['Computational intelligence','Soft Computing coursework']]},
 {name:'Computer vision',items:[['Machine vision','Machine Vision Systems coursework'],['Image processing and visual decision pipelines','Current exploration']]},
 {name:'Robotics',items:[['Robotics fundamentals','Principles of Robotics coursework'],['Planning, sensing, simulation','Current exploration']]},
 {name:'Automation & control',items:[['Feedback and control','Automatic Control Systems coursework'],['Microcontrollers and PLC','Academic coursework'],['CLI workflow automation','Public Python project']]},
 {name:'Software systems',items:[['REST, request signing, validation, modular design, pytest','Public Testnet CLI'],['React, Next.js, interfaces, server routes','Portfolio workspace'],['GitHub and documentation','Public repositories']]},
];
export const engineeringMethod = [
 ['Understand','First, I work out what the system needs to do and what problem I am trying to solve.'],
 ['Plan','I decide what to try, note my assumptions, and define what a useful result would look like.'],
 ['Build','I start with a small working version so I can test the main idea before adding more features.'],
 ['Measure','I check how it behaves and record the setup so the results can be compared later.'],
 ['Test','I try invalid inputs and failure cases, not just the path where everything works.'],
 ['Check','I compare the result with what I expected and look for assumptions that did not hold up.'],
 ['Improve','I use what I found to improve the design and keep notes on why it changed.'],
];
