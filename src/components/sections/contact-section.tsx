"use client";

import { useForm, ValidationError } from '@formspree/react';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AnimatedDiv } from '../shared/animated-div';

const formId = process.env.NEXT_PUBLIC_CONTACT_FORM_ID || 'mgvnadyy';
const fieldClass = 'rounded-xl border-slate-400/30 bg-white/30 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-visible:ring-primary/40 dark:border-white/20 dark:bg-slate-900/40';

export function ContactSection() {
  const [state, handleSubmit, reset] = useForm(formId);
  return (
    <section id="contact" className="w-full px-4 pt-24 pb-32 sm:pt-24 lg:pt-24">
      <div className="mx-auto max-w-2xl">
        <AnimatedDiv>
          <h1 className="mb-10 text-center font-headline text-3xl font-bold tracking-tight sm:mb-11 sm:text-4xl">Contact Me</h1>
        </AnimatedDiv>
        <AnimatedDiv delay={0.15}>
          <div className="glass-strong relative overflow-hidden rounded-[24px] border border-slate-400/25 bg-white/35 p-6 shadow-[0_20px_70px_-40px_rgba(15,23,42,0.4)] dark:border-white/15 dark:bg-slate-950/25">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.18),transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(132,204,22,0.14),transparent_45%)]" />
            <div className="relative">
              {state.succeeded ? (
                <div role="status" className="flex min-h-[350px] flex-col items-center justify-center text-center">
                  <CheckCircle2 className="mb-5 h-12 w-12 text-emerald-500" />
                  <h2 className="font-headline text-2xl font-bold">Message sent!</h2>
                  <p className="mt-3 max-w-sm text-sm text-muted-foreground">Thanks for reaching out. I'll get back to you as soon as possible.</p>
                  <Button variant="outline" onClick={reset} className="mt-6 rounded-xl">Send another message</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} action={`https://formspree.io/f/${formId}`} method="POST" className="space-y-6">
                  <input type="hidden" name="_subject" value="New portfolio contact message" />
                  <div className="hidden" aria-hidden="true"><label htmlFor="contact-company">Leave this empty</label><input id="contact-company" name="_gotcha" tabIndex={-1} autoComplete="off" /></div>
                  <div>
                    <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-muted-foreground">Name</label>
                    <Input id="contact-name" name="name" type="text" required maxLength={100} autoComplete="name" placeholder="Your Name" disabled={state.submitting} className={`h-11 ${fieldClass}`} aria-describedby="contact-name-error" />
                    <ValidationError id="contact-name-error" prefix="Name" field="name" errors={state.errors} className="mt-2 text-sm text-destructive" />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-muted-foreground">Email Address</label>
                    <Input id="contact-email" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="your.email@example.com" disabled={state.submitting} className={`h-11 ${fieldClass}`} aria-describedby="contact-email-error" />
                    <ValidationError id="contact-email-error" prefix="Email" field="email" errors={state.errors} className="mt-2 text-sm text-destructive" />
                  </div>
                  <div>
                    <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-muted-foreground">Message</label>
                    <Textarea id="contact-message" name="message" required maxLength={10000} rows={5} placeholder="Your message..." disabled={state.submitting} className={`min-h-[124px] ${fieldClass}`} aria-describedby="contact-message-error" />
                    <ValidationError id="contact-message-error" prefix="Message" field="message" errors={state.errors} className="mt-2 text-sm text-destructive" />
                  </div>
                  {state.errors && <div role="alert"><ValidationError errors={state.errors} className="text-sm text-destructive" /><p className="mt-2 text-xs text-muted-foreground">If sending fails, you can also email <a className="underline" href="mailto:viditshah5656@gmail.com">viditshah5656@gmail.com</a>.</p></div>}
                  <Button type="submit" variant="outline" disabled={state.submitting} className="h-10 w-full rounded-xl border-slate-400/30 bg-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-primary/10 dark:border-white/20 dark:bg-slate-900/40">
                    {state.submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <><Send className="mr-2 h-4 w-4" />Send Message</>}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </AnimatedDiv>
      </div>
    </section>
  );
}
