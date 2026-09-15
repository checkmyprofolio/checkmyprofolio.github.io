export type PortfolioDocument = {
  id: string;
  title: string;
  category: 'Resume' | 'Certificate';
  // Public local file, e.g. /documents/resume.pdf. Only publish approved documents.
  href: string;
  format: 'pdf' | 'image';
  description?: string;
  previewHref?: string;
};

// Add real documents here after copying them into public/documents.
// No certificates or credentials are inferred from the biography.
export const portfolioDocuments: PortfolioDocument[] = [
 {id:'resume',title:'My resume',category:'Resume',href:'/documents/vidit-shah-resume.pdf',format:'pdf',previewHref:'/documents/previews/vidit-shah-resume.png',description:'Education, skills, and project experience'},
 {id:'cs50x',title:'CS50x',category:'Certificate',href:'/documents/cs50x.pdf',format:'pdf',previewHref:'/documents/previews/cs50x.png',description:'CS50 / Harvard University / 2024'},
 {id:'freecodecamp',title:'Machine Learning with Python',category:'Certificate',href:'/documents/freecodecamp.pdf',format:'pdf',previewHref:'/documents/previews/freecodecamp.png',description:'freeCodeCamp / January 2025'},
 {id:'elements-of-ai',title:'Elements of AI',category:'Certificate',href:'/documents/elements-of-ai.pdf',format:'pdf',previewHref:'/documents/previews/elements-of-ai.png',description:'University of Helsinki & MinnaLearn / 2 ECTS / 2025'},
 {id:'generative-ai',title:'What Is Generative AI?',category:'Certificate',href:'/documents/generative-ai.pdf',format:'pdf',previewHref:'/documents/previews/generative-ai.png',description:'LinkedIn Learning / July 2026'},
 {id:'manufacturing',title:'AI for Manufacturing',category:'Certificate',href:'/documents/ai-for-manufacturing.jpeg',format:'image',previewHref:'/documents/ai-for-manufacturing.jpeg',description:'GTU & Intel India / July 2025'},
];
