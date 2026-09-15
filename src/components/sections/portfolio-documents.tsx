"use client";
import { useState, useRef, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { FileText, Award, ArrowUpRight, Download, X } from 'lucide-react';
import { portfolioDocuments, type PortfolioDocument } from '@/lib/portfolio-documents';
import { Button } from '@/components/ui/button';
import { withBase } from '@/lib/base-path';
import styles from './engineering-dashboard.module.css';
export function PortfolioDocuments() {
 const [original,setOriginal] = useState(false);
 const opener = useRef<HTMLButtonElement | null>(null);
 const [document,setDocument] = useState<PortfolioDocument | null>(null);
 const [isOpen, setIsOpen] = useState(false);
 const mounted = useRef(false);
 const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
 const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
 const openedByHover = useRef(false);
 function cancelHover() { if (hoverTimer.current) { clearTimeout(hoverTimer.current); hoverTimer.current = null; } }
 function cancelClose() { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null; } }
 function closeHoverPreview() {
  if (!openedByHover.current || closeTimer.current) return;
  closeTimer.current = setTimeout(() => {
   closeTimer.current = null;
   if (mounted.current && openedByHover.current) setIsOpen(false);
  }, 250);
 }
 useEffect(() => {
  mounted.current = true;
  return () => { mounted.current = false; cancelHover(); cancelClose(); };
 }, []);
 function openDocument(doc: PortfolioDocument, button: HTMLButtonElement, hover = false) {
  cancelHover(); cancelClose();
  if (!mounted.current || !button.isConnected) return;
  openedByHover.current = hover;
  opener.current = button; setOriginal(false); setDocument(doc); setIsOpen(true);
 }
 function card(doc: PortfolioDocument) {
  const resume = doc.category === 'Resume';
  return <button key={doc.id} aria-label={`Preview ${doc.title}`} aria-haspopup="dialog"
   onPointerEnter={event => {
    if (event.pointerType !== 'mouse' || isOpen) return;
    const button = event.currentTarget;
    cancelHover();
    hoverTimer.current = setTimeout(() => openDocument(doc,button,true), 350);
   }}
   onPointerLeave={cancelHover} onPointerDown={cancelHover}
   onClick={event => openDocument(doc,event.currentTarget)}
   className={`${styles.documentCard} ${resume ? styles.resumeCard : ''}`}>
   {resume && <img src={withBase(doc.previewHref) || withBase(doc.href)} alt="" className={styles.resumeThumbnail} loading="lazy" />}
   <div className={styles.documentCardInfo}>{resume ? <FileText size={21} /> : <Award size={21} />}<span><strong>{doc.title}</strong>{doc.description && <small>{doc.description}</small>}</span><ArrowUpRight size={17} /></div>
  </button>;
 }
 return <section id="documents" className={`${styles.documentsSection} ${styles.documentsColumns}`}>
  <div className={`${styles.panel} ${styles.documentsPanel}`}><div className={styles.documentsIntro}><FileText size={25} className="text-primary" /><div><h2>Resume</h2><p>Hover to preview, or click to open.</p></div></div><div className={styles.resumeGrid}>{portfolioDocuments.filter(doc=>doc.category==='Resume').map(card)}</div></div>
  <div className={`${styles.panel} ${styles.documentsPanel}`}><div className={styles.documentsIntro}><Award size={25} className="text-primary" /><div><h2>Certificates</h2><p>Hover over a certificate to read it.</p></div></div><div className={styles.certificateGrid}>{portfolioDocuments.filter(doc=>doc.category==='Certificate').map(card)}</div></div>
  <Dialog.Root open={isOpen} onOpenChange={open=>{cancelHover(); cancelClose(); setIsOpen(open);}}><Dialog.Portal><Dialog.Overlay onPointerMove={event=>{if(event.pointerType === 'mouse') closeHoverPreview();}} className="fixed inset-0 z-[260] bg-slate-950/50 backdrop-blur-lg" /><Dialog.Content onPointerEnter={cancelClose} onPointerLeave={event=>{
   if (event.pointerType !== 'mouse') return;
   const bounds = event.currentTarget.getBoundingClientRect();
   if (event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom) return;
   closeHoverPreview();
  }} onCloseAutoFocus={event=>{event.preventDefault();if (opener.current?.isConnected) opener.current.focus({ preventScroll: true });}} className="glass-strong fixed left-1/2 top-1/2 z-[270] flex h-[min(860px,calc(100dvh-2rem))] w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/20 bg-background/90 shadow-2xl outline-none"><div className="flex shrink-0 items-center justify-between gap-3 border-b p-4"><div><Dialog.Title className="font-headline font-semibold">{document?.title}</Dialog.Title><Dialog.Description className="text-xs text-muted-foreground">{document?.category} / Document preview</Dialog.Description></div><div className="flex shrink-0 gap-1">{document?.format==='pdf' && <Button variant="ghost" className="px-2 text-xs" aria-pressed={original} onClick={()=>setOriginal(!original)}>{original ? 'Preview' : 'PDF'}</Button>}{document && <><Button asChild variant="ghost" size="icon"><a href={withBase(document.href)} download aria-label="Download document"><Download size={18} /></a></Button><Button asChild variant="ghost" size="icon"><a href={withBase(document.href)} target="_blank" rel="noopener noreferrer" aria-label="Open document in a new tab"><ArrowUpRight size={18} /></a></Button></>}<Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close document"><X size={18} /></Button></Dialog.Close></div></div><div className="min-h-0 flex-1 overflow-auto bg-slate-900/20">{document?.format==='pdf' && original ? <iframe key={document.id} title={document.title} src={withBase(document.href)} className="h-full w-full border-0 bg-white" /> : document ? <img src={withBase(document.previewHref) || withBase(document.href)} alt={document.title} className="mx-auto h-auto max-w-full object-contain p-4" /> : null}</div><p className="shrink-0 border-t px-4 py-2 text-xs text-muted-foreground">You can download the original file or open it in a new tab.</p></Dialog.Content></Dialog.Portal></Dialog.Root>
 </section>;
}
