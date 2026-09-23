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
export type ProjectVisibility = 'public' | 'private' | 'exploration';

export type FeaturedSystem = {
 id:string;
 title:string;
 categories:string[];
 level:EvidenceLevel;
 visibility:ProjectVisibility;
 problem:string;
 approach:string;
 architecture:string;
 technologies:string[];
 decisions:string;
 evidence:string;
 limitations:string;
 nextStep:string;
 source?:string;
 liveUrl?:string;
 page?:string;
};

export const featuredSystems: FeaturedSystem[] = [
 {id:'aerosynth3d',title:'AeroSynth 3D / Single-Pass Drone Video Reconstruction',categories:['Computer vision','3D reconstruction','Photogrammetry','Robotics'],level:'Public project',visibility:'public',
  problem:'Turn an aerial drone video into a metric 3D reconstruction through a single continuous flight pass.',
  approach:'Validate video metadata, extract useful frames, reject poor-quality frames, select keyframes using motion/GPS cues, optionally mask dynamic objects, perform real Structure-from-Motion, densify with native Multi-View Stereo, reconstruct and texture the mesh, then analyze and georeference when real telemetry is available.',
  architecture:'Drone video + optional SRT/GPX/CSV -> frame extraction -> quality filtering -> keyframes -> optional YOLO dynamic masking -> COLMAP/SIFT -> GLOMAP or pycolmap -> InterfaceCOLMAP -> DensifyPointCloud -> ReconstructMesh -> TextureMesh -> analysis/georeference -> validated artifacts.',
  technologies:['Python','FastAPI','OpenCV','COLMAP','GLOMAP','pycolmap','OpenMVS','SIFT','YOLO','WebGL','3D reconstruction'],
  decisions:'Use real SfM/MVS backends rather than synthetic depth; treat missing telemetry as local metric coordinates instead of inventing GPS; require declared output artifacts to exist and be non-empty before a run is reported successful.',
  evidence:'Public repository README documents the full reconstruction pipeline, API surface, Codespaces workflow, native OpenMVS build, artifact-validation gate, and a distinction between internal reprojection error and absolute survey accuracy.',
  limitations:'A single video pass cannot guarantee survey accuracy. Reconstruction quality depends on camera motion, overlap, texture, exposure, scene geometry, telemetry/GCP quality, and the native SfM/MVS toolchain.',
  nextStep:'Continue publishing reproducible runtime checks and hardware-specific validation for CPU, Apple MPS, and NVIDIA CUDA paths.',
  source:'https://github.com/viditshah5656/single_pass_3D',
  liveUrl:'https://viditshah5656.github.io/single_pass_3D/'},

 {id:'meeraai', title:'MeeraAI / Desktop Assistant & Meera Browser', categories:['AI / ML','Local AI','Software systems','Automation','Voice AI'], level:'Source reviewed', visibility:'private',
  ...meeraSummary,
  technologies:['Python','FastAPI','TypeScript','React','Electron','GGUF','llama.cpp','Playwright','SQLite','MCP','RAG','Qwen3-TTS','faster-whisper'],
  page:'/meeraai',
  evidence:'Private/local project context plus source review on 15 September 2026. The published portfolio documents the application architecture, model profiles, browser layers, 22 focused regression checks, and known validation gaps. The project is not presented as a public source repository here.',
  limitations:meeraSummary.limitations,
  nextStep:'Keep the private project documentation synchronized with the public MeeraAI walkthrough and add reproducible evidence for voice, vision, browser automation, model tiers, and packaged releases.'},
 {id:'aarnaai',title:'AarnaAI',categories:['AI / ML','Machine Learning','Deep Learning','Financial data experimentation'],level:'Project brief',visibility:'private',
  problem:'Develop an ML-based market-analysis and prediction application around ticker-driven historical data and technical indicators.',
  approach:'Streamlit interface with ticker input and selectable strategy periods (1mo, 3mo, 6mo, 1y, 2y, 5y), combining an LSTM time-series model with a RandomForest classifier and technical indicators.',
  architecture:'Ticker/data source -> preprocessing -> technical indicators (SMA9, RSI, MACD, Bollinger Bands) -> LSTM / RandomForest experimentation -> Streamlit visualization and prediction interface.',
  technologies:['Python','Streamlit','pandas','numpy','scikit-learn','TensorFlow','Keras','yfinance','IndianAPI.in','pandas_ta','plotly'],
  decisions:'Keep the model and indicator experiments separated from claims about investment performance; treat the project as an engineering/ML experiment rather than financial advice.',
  evidence:'Private project details supplied by Vidit, including AarnaAI-v1.0, AarnaAI-v2.0, and AarnaAI-Files development history. No public repository or independently reproduced performance benchmark is linked here.',
  limitations:'No public accuracy, return, live-trading, or financial-performance claim.',
  nextStep:'Publish versioned model notes, feature definitions, dataset provenance, baseline comparisons, and evaluation methodology.'},
 {id:'airlearn',title:'AIRLearn / AirLearn',categories:['AI / ML','Robotics education','EdTech','Web'],level:'Project brief',visibility:'private',
  problem:'Create an AI/Robotics learning platform that makes technical learning more interactive.',
  approach:'AI chatbot and educational web platform using Next.js and Firebase.',
  architecture:'Next.js web experience -> Firebase services -> educational content and AI chatbot layer.',
  technologies:['Next.js','Firebase','AI chatbot','JavaScript/TypeScript'],
  decisions:'Keep the learning experience centered on practical AI and robotics topics.',
  evidence:'Project details were supplied in Vidit\'s earlier portfolio project context. The current public portfolio does not expose a public source repository for this project.',
  limitations:'No public user count, deployed feature inventory, or learning-outcome benchmark is claimed.',
  nextStep:'Document the learning modules, chatbot behavior, and implementation boundaries in a shareable project brief.'},
 {id:'ai-cctv',title:'AI CCTV Surveillance',categories:['Computer vision','AI / ML','Industrial monitoring','Robotics'],level:'Project brief',visibility:'private',
  problem:'Use computer vision for real-time industrial monitoring and analysis, including the Jyoti CNC problem context explored during an Intel AI program.',
  approach:'Vision-based monitoring pipeline intended to observe industrial scenes and extract actionable information.',
  architecture:'Camera/video stream -> preprocessing -> computer vision analysis -> event/condition understanding -> monitoring output.',
  technologies:['Computer vision','AI/ML','Python','OpenCV'],
  decisions:'Treat the surveillance system as a complete monitoring pipeline rather than only a detector model.',
  evidence:'Project concept and Jyoti CNC problem context were supplied by Vidit. A public implementation, dataset, accuracy, or FPS benchmark is not linked here.',
  limitations:'No production deployment, accuracy, latency, or safety-critical guarantee is claimed.',
  nextStep:'Publish the precise detection task, dataset, evaluation metrics, and system constraints.'},
 {id:'youtube-music-automation',title:'YouTube Music Automation Tool',categories:['Automation','Python','Desktop software'],level:'Project brief',visibility:'private',
  problem:'Automate YouTube Music tasks through a custom desktop interface.',
  approach:'Python automation with a custom GUI for interacting with the workflow.',
  architecture:'GUI -> automation controller -> browser/service interaction -> task result.',
  technologies:['Python','GUI automation'],
  decisions:'Separate the user interface from the automation workflow so actions can be controlled and debugged.',
  evidence:'Project name and implementation direction were supplied by Vidit; no public source repository is linked in the current portfolio.',
  limitations:'No public reliability, browser compatibility, or deployment claim.',
  nextStep:'Document supported workflows, failure handling, and reproducible setup instructions.'},
 {id:'iot-automation',title:'IoT & ESP32 Automation',categories:['IoT','Automation','Embedded systems'],level:'Project brief',visibility:'private',
  problem:'Automate home/office tasks using connected embedded hardware.',
  approach:'ESP32-based automation connecting physical inputs/outputs to software-controlled workflows.',
  architecture:'Sensor/input -> ESP32 -> control logic -> actuator/output -> monitoring/feedback.',
  technologies:['ESP32','Microcontrollers','IoT','Automation'],
  decisions:'Keep the embedded control path simple and observable so physical actions can be tested independently.',
  evidence:'Project direction was supplied by Vidit as part of his earlier engineering project history. No public repository or hardware test report is linked here.',
  limitations:'No current device inventory, uptime, deployment scale, or benchmark is claimed.',
  nextStep:'Document the exact circuit, firmware, protocol, and test procedure for one reproducible automation scenario.'},
 {id:'gemini-web2api',title:'Gemini Web2API',categories:['AI / ML','APIs','Software systems'],level:'Project brief',visibility:'private',
  problem:'Experiment with an API-oriented bridge around AI/web capabilities.',
  approach:'Prototype an interface that makes an upstream AI or web capability accessible through a software API.',
  architecture:'Client request -> API layer -> upstream service -> normalized response.',
  technologies:['Python','REST APIs','HTTP clients','AI integration'],
  decisions:'Keep API boundaries, upstream dependencies, and failure semantics explicit.',
  evidence:'Project identity and API experimentation were supplied by Vidit. The public implementation is represented by the `Infera` repository; this portfolio keeps the project description separate from any provider or upstream-service assumptions.',
  source:'https://github.com/viditshah5656/Infera',
  limitations:'No public scale, uptime, user count, or production-readiness claim.',
  nextStep:'Publish the endpoint contract, examples, rate limits, and error behavior if the project is made public.'},
 {id:'omniroute',title:'OmniRoute',categories:['Software systems','Web','Routing','Integration'],level:'Project brief',visibility:'private',
  problem:'Personal software project being actively developed around application routing/integration.',
  approach:'Ongoing engineering work; detailed implementation claims are intentionally limited until the project documentation is published.',
  architecture:'Not yet documented in the public portfolio.',
  technologies:['JavaScript/TypeScript','Web tooling'],
  decisions:'Keep the public portfolio conservative until the current implementation is stable and documented.',
  evidence:'The project has appeared in Vidit\'s recent development workflow, but a public technical brief is not currently linked.',
  limitations:'No public architecture, feature list, benchmark, or deployment claim.',
  nextStep:'Add a versioned project brief once the current implementation is ready for public description.'},
 {id:'binance-cli',title:'Binance Futures Testnet CLI',categories:['Software systems','Automation'],level:'Public project',visibility:'public',
  problem:'Translate a CLI order request into a validated, signed testnet request while preserving uncertainty about remote outcomes.',
  approach:'Python CLI with separate validation, order translation, signed REST transport, and exception boundaries.',
  architecture:'CLI -> validation -> order logic -> signed REST client -> transport -> client observation.',
  technologies:['Python','Click','HMAC-SHA256','pytest','REST'],
  decisions:'Reject invalid input before transport; distinguish API rejection from a network outcome that cannot be confirmed.',
  evidence:'Public source and README describe mocked tests and testnet runs. These are repository-reported results, not rerun by this portfolio.',
  limitations:'Testnet only. A missing response cannot establish remote state. This is not a live-trading or financial-performance claim.',
  nextStep:'Make reconciliation of unknown outcomes an explicit review topic before extending automation.',
  source:'https://github.com/viditshah5656/binance-futures-trading-bot'},
 {id:'profolio',title:'Profolio',categories:['Software systems','Web','AI'],level:'Source reviewed',visibility:'public',
  problem:'Make Vidit’s engineering background, project evidence, navigation, social links, and contact paths accessible through a polished public website.',
  approach:'Next.js and React portfolio with structured engineering content, project walkthroughs, canonical external links, contact form, and an AI assistant grounded in portfolio evidence.',
  architecture:'Next.js pages -> React components -> structured portfolio knowledge -> remote portfolio assistant / Worker when available.',
  technologies:['TypeScript','JavaScript','React','Next.js','REST','GitHub Pages','Cloudflare Worker','Formspree'],
  decisions:'Centralize canonical links, distinguish verified evidence from private project briefs, validate builds, and keep external destinations explicit.',
  evidence:'Current source is available in the public repository. The GitHub Pages build and Worker typecheck passed during the latest source validation.',
  limitations:'Remote AI functionality depends on the configured Worker deployment. External forms/providers remain integration-dependent.',
  nextStep:'Keep all project and social metadata synchronized with source repositories and validate live integrations.',
  source:'https://github.com/checkmyprofolio/checkmyprofolio.github.io', page:'/projects'},
 {id:'vision-robotics',title:'Robotics & computer vision exploration',categories:['Robotics','Computer vision','Experimental / R&D'],level:'Current exploration',visibility:'exploration',
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
