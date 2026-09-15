"use client";

import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { ArrowUpRight, ArrowRight, GraduationCap, BrainCircuit, Bot, ScanEye, Code2, SlidersHorizontal, Cpu, Check, Github, Compass, Sparkles, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { identity, foundation, domains, skillGroups, engineeringMethod } from '@/lib/engineering-profile';
import styles from './engineering-dashboard.module.css';
import { PortfolioDocuments } from './portfolio-documents';

const icons = [Code2, BrainCircuit, SlidersHorizontal, Bot, ScanEye, Cpu];
const navigation = [['education','Education'],['documents','Documents'],['foundation','Foundation'],['capabilities','Domains'],['skills','Skills'],['method','Method'],['direction','Direction']];
const loop = ['Perceive','Reason','Plan','Control','Act','Improve'];
function Heading({number,title,description}: {number:string;title:string;description:string}) {
 return <div className={styles.sectionHeading}><span className={styles.index}>{number}</span><div><h2>{title}</h2><p>{description}</p></div></div>;
}
function basis(text:string) {
 if (text.toLowerCase().includes('coursework')) return text;
 if (text.toLowerCase().includes('exploration')) return 'Current exploration';
 if (text.includes('direction')) return 'AI development';
 if (text.toLowerCase().includes('workspace')) return 'Portfolio implementation';
 return 'Project work';
}
function tabKeys(event: KeyboardEvent<HTMLDivElement>) {
 if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key)) return;
 const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
 const index = tabs.findIndex(tab => tab === event.target);
 if (index < 0) return;
 event.preventDefault();
 const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (['ArrowRight','ArrowDown'].includes(event.key) ? 1 : -1) + tabs.length) % tabs.length;
 tabs[next].focus(); tabs[next].click();
}
export function EngineeringDashboard() {
 const reduced = useReducedMotion();
 const dashboardRef = useRef<HTMLDivElement>(null);
 const { scrollYProgress } = useScroll();
 const scrollProgress = useSpring(scrollYProgress, {stiffness:100,damping:30});
 useEffect(() => {
  const root = dashboardRef.current;
  if (!root || reduced || !('IntersectionObserver' in window)) return;
  const selector = [styles.panel,styles.documentCard,styles.sectionHeading,styles.subjectButton,styles.heroCopy+' > *',styles.systemVisual,styles.sectionNav,styles.skillMenu+' > button',styles.domainPicker+' > button',styles.methodSteps+' > button',styles.directionStack+' > div',styles.footer].map(value => '.'+value).join(',');
  const elements = Array.from(root.querySelectorAll<HTMLElement>(selector));
  const observer = new IntersectionObserver(entries => {
   entries.forEach(entry => {
    if (entry.isIntersecting) {
     const element = entry.target as HTMLElement;
     element.classList.add(styles.revealed);
     observer.unobserve(element);
    }
   });
  }, {threshold:0.08,rootMargin:'0px 0px -32px 0px'});
  elements.forEach(element => {
   const siblings = element.parentElement ? Array.from(element.parentElement.children) : [];
   element.style.setProperty('--reveal-delay', `${Math.max(0,siblings.indexOf(element)) % 7 * 65}ms`);
   element.classList.add(styles.revealItem);
   observer.observe(element);
  });
  return () => {observer.disconnect(); elements.forEach(element => {element.classList.remove(styles.revealItem,styles.revealed);element.style.removeProperty('--reveal-delay');});};
 },[reduced]);
 const [subject,setSubject] = useState(0);
 const [domain,setDomain] = useState(0);
 const [skill,setSkill] = useState(0);
 const [step,setStep] = useState(0);

 const current = domains[domain];
 return <div ref={dashboardRef} className={styles.dashboard}><motion.div aria-hidden="true" className={styles.scrollProgress} style={{scaleX:reduced ? scrollYProgress : scrollProgress}} />
  <motion.section className={styles.hero} aria-labelledby="profile-title">
   <div className={styles.heroCopy}>
    <p className={styles.eyebrow}><span className={styles.statusDot} />ABOUT ME</p>
    <h1 id="profile-title">Vidit Shah<span className="underline-gradient">Robotics &amp;<br />AI Engineer.</span></h1>
    <p className={styles.intro}>I work on AI software and robotics.</p>
    <p className={styles.heroDescription}>I graduated in Robotics &amp; Automation in 2026. I enjoy building AI applications and understanding how software, sensors, and control systems work together. I care about making things useful and knowing what to do when they fail.</p>
    <div className={styles.heroActions}><Button asChild className="rounded-full px-6"><Link href="/contact">Get in touch <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button><a href={identity.github} target="_blank" rel="noopener noreferrer" className={styles.textLink}><Github size={16} />GitHub <ArrowUpRight size={14} /></a><a href={identity.orcid} target="_blank" rel="noopener noreferrer" className={styles.textLink}>ORCID <ArrowUpRight size={14} /></a></div>
   </div>
   <div className={styles.systemVisual} aria-label="Conceptual engineering loop: perceive, reason, plan, control, act, improve">
    <div aria-hidden="true" className={styles.orbitGlow} /><div aria-hidden="true" className={styles.orbitOuter} /><div aria-hidden="true" className={styles.orbitInner} />
    <div className={styles.systemCore}><BrainCircuit size={38} /><strong>INTELLIGENT<br />SYSTEMS</strong><span>How I think about robotics</span></div>
    {loop.map((label,i) => <div key={label} className={styles.orbitNode} style={{left:`${50 + 40 * Math.cos((i * 60 - 90)*Math.PI/180)}%`,top:`${50 + 40 * Math.sin((i * 60 - 90)*Math.PI/180)}%`}}><span>{String(i+1).padStart(2,'0')}</span>{label}</div>)}
    <p className={styles.visualCaption}>FROM SENSING TO ACTION</p>
   </div>
  </motion.section>
  <nav className={styles.sectionNav} aria-label="Engineering profile sections">{navigation.map(([id,label],i) => <a key={id} href={`#${id}`}><span>{String(i+1).padStart(2,'0')}</span>{label}</a>)}</nav>
  <motion.section id="education" className={styles.education}>
   <div className={`${styles.panel} ${styles.degreePanel}`}><div className={styles.panelTop}><GraduationCap size={24} /><span className={styles.pill}><Check size={12} />Degree completed</span></div><p className={styles.eyebrow}>EDUCATION / 2022-2026</p><h2>B.E. Robotics<br />&amp; Automation</h2><p className={styles.university}>{identity.university}</p><p className={styles.muted}>{identity.institution}</p><div className={styles.degreeFoot}><span>2022 intake</span><ArrowRight size={16} /><span>2026 graduate</span></div></div>
   <div className={`${styles.panel} ${styles.gradePanel}`}><p className={styles.eyebrow}>FINAL CGPA</p><div className={styles.gradeValue}>8.45<span>/ 10</span></div><p>Final CGPA</p><span className={styles.muted}>B.E. / Gujarat Technological University</span><div className={styles.gradeLine} aria-hidden="true" /></div>
   <div className={`${styles.panel} ${styles.focusPanel}`}><Compass className="text-primary" size={24} /><p className={styles.eyebrow}>WHAT I WORK ON</p><h3>Robotics, AI,<br />and software.</h3><p className={styles.muted}>My degree covered robotics, control systems, and machine vision. My interests also include local AI and building software applications.</p><span className={styles.pill}>Robotics &amp; Automation graduate</span></div>
  </motion.section>
  <PortfolioDocuments />
  <motion.section id="foundation" className={styles.section}>
   <Heading number="02" title="What I studied" description="The subjects from my degree that relate to the work I do today." />
   <div className={styles.foundationGrid}><div className={styles.subjects} role="tablist" onKeyDown={tabKeys} aria-label="Academic foundation">{foundation.map((f,i) => {const Icon=icons[i];return <button key={f.area} role="tab" id={`subject-tab-${i}`} tabIndex={subject===i ? 0 : -1} aria-selected={subject===i} aria-controls="subject-panel" onClick={()=>setSubject(i)} className={`${styles.subjectButton} ${subject===i ? styles.selected : ''}`}><Icon size={20} /><span>{f.area}</span><ArrowUpRight size={16} /></button>;})}</div>
    <div className={`${styles.panel} ${styles.foundationDetail}`} role="tabpanel" id="subject-panel" aria-labelledby={`subject-tab-${subject}`} tabIndex={0}><span className={styles.pill}>Academic coursework</span><h3>{foundation[subject].area}</h3><p>{foundation[subject].meaning}</p><div className={styles.courseList}>{foundation[subject].courses.map(c=><span key={c}>{c}</span>)}</div><p className={styles.smallNote}>These subjects were part of my B.E. curriculum.</p></div>
   </div>
  </motion.section>
  <motion.section id="capabilities" className={styles.section}>
   <Heading number="03" title="My areas of interest" description="Choose an area to read about my background and what I want to explore next." />
   <div className={`${styles.panel} ${styles.domainPanel}`}><div className={styles.domainPicker} role="tablist" onKeyDown={tabKeys} aria-label="Engineering domains">{domains.map((d,i)=><button key={d.name} id={`domain-tab-${i}`} role="tab" tabIndex={domain===i ? 0 : -1} aria-selected={domain===i} aria-controls="domain-panel" onClick={()=>setDomain(i)} className={domain===i ? styles.activeChip : ''}>{d.name}</button>)}</div><div className={styles.domainDetail} role="tabpanel" id="domain-panel" aria-labelledby={`domain-tab-${domain}`} tabIndex={0}><div><p className={styles.eyebrow}>AREA OF INTEREST / {String(domain+1).padStart(2,'0')}</p><h3>{current.name}</h3><p>{current.work}</p></div><dl><div><dt>Related coursework</dt><dd>{current.academic}</dd></div><div><dt>My background</dt><dd>{current.evidence}</dd></div><div><dt>What I want to work on next</dt><dd>{current.future}</dd></div></dl></div></div>
  </motion.section>
  <motion.section id="skills" className={styles.section}>
   <Heading number="04" title="Skills and tools" description="The tools I have used, alongside subjects I studied and areas I am still exploring." />
   <div className={styles.skillLayout}><div className={styles.skillMenu} role="tablist" onKeyDown={tabKeys} aria-label="Skill categories">{skillGroups.map((g,i)=><button key={g.name} role="tab" id={`skill-tab-${i}`} tabIndex={skill===i ? 0 : -1} aria-selected={skill===i} aria-controls="skill-panel" onClick={()=>setSkill(i)} className={skill===i ? styles.selected : ''}><span>{String(i+1).padStart(2,'0')}</span>{g.name}<ArrowRight size={16} /></button>)}</div><div className={`${styles.panel} ${styles.skillDetail}`} role="tabpanel" id="skill-panel" aria-labelledby={`skill-tab-${skill}`} tabIndex={0}><Code2 size={28} className="text-primary" /><h3>{skillGroups[skill].name}</h3><ul>{skillGroups[skill].items.map(([name,evidence])=><li key={name}><span>{name}</span><small>{basis(evidence)}</small></li>)}</ul><p className={styles.smallNote}>Each skill is labeled to show whether I used it in a project, studied it, or am exploring it.</p></div></div>
  </motion.section>
  <motion.section id="method" className={styles.section}>
   <Heading number="05" title="How I approach a problem" description="I start by understanding the problem, test my assumptions, and improve the design based on what I find." />
   <div className={`${styles.panel} ${styles.methodPanel}`}><div className={styles.methodSteps} aria-label="Engineering method">{engineeringMethod.map(([name],i)=><button key={name} aria-pressed={step===i} onClick={()=>setStep(i)} className={step===i ? styles.activeStep : ''}><span>{String(i+1).padStart(2,'0')}</span>{name}</button>)}</div><div className={styles.methodDetail} aria-live="polite"><Activity size={28} /><h3>{engineeringMethod[step][0]}</h3><p>{engineeringMethod[step][1]}</p></div><div className={styles.methodFooter}><span>Architecture</span><span>Constraints</span><span>Failure analysis</span><span>Verification</span><span>Reproducibility</span></div></div>
  </motion.section>
  <motion.section id="direction" className={`${styles.panel} ${styles.directionPanel}`}><div><p className={styles.eyebrow}><Sparkles size={14} />WHAT I WANT TO BUILD</p><h2>Robots that can<br /><span className="underline-gradient">sense and respond.</span></h2><p>I want to bring my work in AI closer to robotics: using camera and sensor data to understand a situation, choose an action, and learn from the result.</p><p className={styles.smallNote}>This is where I want to take my work next.</p><Button asChild variant="outline" className="mt-6 rounded-full"><Link href="/contact">Contact me <ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button></div><div className={styles.directionStack}>{['Perception','AI + planning','Control + action','Feedback + iteration'].map((label,i)=><div key={label}><span>{String(i+1).padStart(2,'0')}</span>{label}<ArrowRight size={16} /></div>)}</div></motion.section>
  <motion.footer className={styles.footer}><span>You can find my work on the Projects page.</span><Link href="/projects">View my projects <ArrowUpRight size={18} /></Link></motion.footer>
 </div>;
}
