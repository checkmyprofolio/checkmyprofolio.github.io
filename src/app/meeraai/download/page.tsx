'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  Code2,
  Cpu,
  Download,
  FileArchive,
  FolderOpen,
  HardDriveDownload,
  Package,
  Server,
  Shield,
  TerminalSquare,
  Workflow,
} from 'lucide-react';

import { AnimatedDiv } from '@/components/shared/animated-div';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { meeraAIDownloads } from '@/lib/meeraai-downloads';

const downloadBundles = [
  {
    title: 'Desktop Frontend Source',
    badge: 'React + TypeScript + Vite + Electron',
    href: meeraAIDownloads.frontend.href,
    fileName: meeraAIDownloads.frontend.fileName,
    sizeLabel: meeraAIDownloads.frontend.sizeLabel,
    description:
      'This is the main desktop app source package. It contains the React UI, TypeScript codebase, Electron shell, scripts, and frontend assets used to run, build, and package MeeraAI.',
    points: [
      'Use this archive if you want to run the MeeraAI desktop client locally with npm.',
      'Includes frontend source, Electron files, public assets, scripts, and package metadata.',
      'Excludes node_modules, release output, and environment secrets so you should run npm install after extraction.',
    ],
    quickUse: 'Run the backend first, then use npm install and npm run dev inside desktop_frontend.',
  },
  {
    title: 'Installer Source',
    badge: 'Electron Installer Packaging Project',
    href: meeraAIDownloads.installer.href,
    fileName: meeraAIDownloads.installer.fileName,
    sizeLabel: meeraAIDownloads.installer.sizeLabel,
    description:
      'This is the Windows installer/packaging source. It is a separate Electron project that wraps the built MeeraAI desktop release into an installer-style distribution flow.',
    points: [
      'Use this after the desktop_frontend project has already been built or packaged.',
      'Includes app UI files, build resources, packaging scripts, and Electron main/preload files.',
      'Excludes node_modules, payload cache, and release output so you should run npm install after extraction.',
    ],
    quickUse: 'Package the frontend first, then run npm install and npm run package inside installer.',
  },
] as const;

const stackExplainers: Array<{
  title: string;
  body: string;
  icon: LucideIcon;
}> = [
  {
    title: 'Node.js',
    body: 'Node.js runs the frontend tooling, Electron scripts, and package commands used throughout both source packages.',
    icon: Cpu,
  },
  {
    title: 'npm',
    body: 'npm installs dependencies and runs the project scripts defined in package.json, such as dev, build, package, and dist.',
    icon: Package,
  },
  {
    title: 'React + TypeScript',
    body: 'React builds the interface and TypeScript keeps the desktop frontend codebase structured, typed, and easier to maintain.',
    icon: Code2,
  },
  {
    title: 'Vite',
    body: 'Vite powers the fast dev server and production frontend build process in the desktop_frontend project.',
    icon: Workflow,
  },
  {
    title: 'Electron',
    body: 'Electron wraps the frontend into a desktop application shell and is also used again in the dedicated installer project.',
    icon: HardDriveDownload,
  },
  {
    title: 'Python',
    body: 'Python is used by the Meera backend and helper scripts, including the Meera API process and asset-preparation steps.',
    icon: Server,
  },
];

const frontendRunCommands = [
  {
    title: 'Start the backend API first',
    code: `cd Agent\npython Meera.py --api --port 8000`,
  },
  {
    title: 'Install and run the desktop frontend',
    code: `cd Agent\\desktop_frontend\nnpm install\nnpm run dev`,
  },
  {
    title: 'Build and package the app',
    code: `cd Agent\\desktop_frontend\nnpm run build\nnpm run package\nnpm run dist`,
  },
] as const;

const installerCommands = [
  {
    title: 'Expected folder layout before packaging',
    code: `Agent/\n  Meera.py\n  requirements.txt\n  desktop_frontend/\n  installer/`,
  },
  {
    title: 'Build the frontend package first',
    code: `cd Agent\\desktop_frontend\nnpm install\nnpm run package`,
  },
  {
    title: 'Then package the installer project',
    code: `cd Agent\\installer\nnpm install\nnpm run package`,
  },
] as const;

const frontendScripts = [
  '`npm run dev` starts Vite and Electron together for local development.',
  '`npm run build` creates the production frontend build and compiles the Electron TypeScript layer.',
  '`npm run package` runs the Electron builder flow for the Windows app package.',
  '`npm run dist` runs the broader distribution flow after building.',
  '`npm run backend` starts the Meera backend API from the frontend project scripts.',
] as const;

const installerScripts = [
  '`npm run prepare:icon` prepares installer icon resources.',
  '`npm run prepare:payload` copies the built desktop release into the installer payload.',
  '`npm run clean:release` removes stale release output before repackaging.',
  '`npm run finalize:release` normalizes the final executable naming.',
  '`npm run package` runs the full installer packaging pipeline for the Windows portable build.',
] as const;

function CommandBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/45 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <pre className="mt-3 overflow-x-auto rounded-xl border border-primary/10 bg-black/90 px-4 py-3 text-sm leading-6 text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function MeeraAIDownloadPage() {
  return (
    <section className="w-full py-16 sm:py-20">
      <div className="container mx-auto max-w-6xl px-4">
        <AnimatedDiv>
          <Button asChild variant="ghost" className="mb-6">
            <Link href="/meeraai">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to MeeraAI
            </Link>
          </Button>
        </AnimatedDiv>

        <AnimatedDiv>
          <Card className="overflow-hidden border-primary/20 bg-card/65 backdrop-blur-sm">
            <CardContent className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <Badge variant="secondary" className="border border-primary/20 bg-primary/10 text-primary">
                  Source Downloads
                </Badge>
                <h1 className="mt-5 font-headline text-4xl font-bold tracking-tight sm:text-5xl">
                  Download the MeeraAI frontend and installer source packages
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
                  This page now ships two real downloads: the main `desktop_frontend` source archive and the
                  separate `installer` source archive. The guidance below explains exactly what each package is for,
                  how npm is used, where Electron fits, and how to run or build the projects correctly after extraction.
                </p>
                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button asChild size="lg">
                    <a href={meeraAIDownloads.frontend.href} target="_blank" rel="noreferrer">
                      Open Frontend Source
                      <Download className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <a href={meeraAIDownloads.installer.href} target="_blank" rel="noreferrer">
                      Open Installer Source
                      <FileArchive className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="rounded-3xl border border-dashed border-primary/30 bg-background/35 p-6">
                <div className="flex h-full min-h-[280px] flex-col justify-between rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-primary/80">Important</p>
                      <p className="mt-3 text-lg font-semibold leading-7 text-foreground">
                        Both downloads are source archives, not preinstalled binaries.
                      </p>
                    </div>
                    <div className="space-y-3 text-sm leading-6 text-muted-foreground">
                      <p>Recommended environment: Windows, Node.js 20 LTS, npm 10+, and Python available in PATH.</p>
                      <p>Run `npm install` after extraction because `node_modules` is intentionally not included.</p>
                      <p>These source archives are hosted externally on JioAICloud so the web app can stay lightweight on Vercel.</p>
                      <p>Each button opens the JioAICloud share page in a new tab, where the real file download starts.</p>
                      <p>
                        The frontend archive is the main package for local development. The installer archive is the
                        packaging layer that depends on the frontend release output.
                      </p>
                      <p>Each archive also includes a `DOWNLOAD_GUIDE.txt` file for offline handoff guidance.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedDiv>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {downloadBundles.map((bundle, index) => (
            <AnimatedDiv key={bundle.title} delay={0.08 + index * 0.06}>
              <Card className="h-full bg-card/55 backdrop-blur-sm">
                <CardHeader>
                  <Badge variant="outline" className="w-fit border-primary/25 bg-primary/5 text-primary">
                    {bundle.badge}
                  </Badge>
                  <CardTitle className="mt-3 flex items-center gap-3 font-headline text-2xl">
                    <FolderOpen className="h-6 w-6 text-primary" />
                    {bundle.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-6 text-muted-foreground">
                    {bundle.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-2xl border border-dashed border-primary/20 bg-background/35 px-4 py-3 text-sm text-foreground/90">
                    {bundle.fileName} ({bundle.sizeLabel})
                  </div>
                  <div className="space-y-3">
                    {bundle.points.map((point) => (
                      <div key={point} className="rounded-2xl border border-border/60 bg-background/35 px-4 py-3 text-sm leading-6 text-foreground/90">
                        {point}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6 text-foreground/90">
                    {bundle.quickUse}
                  </div>
                  <Button asChild className="w-full">
                    <a href={bundle.href} target="_blank" rel="noreferrer">
                      Open {bundle.title}
                      <Download className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </AnimatedDiv>
          ))}
        </div>

        <AnimatedDiv delay={0.18} className="mt-12">
          <Card className="bg-card/55 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 font-headline text-2xl">
                <Cpu className="h-6 w-6 text-primary" />
                What each tool is doing in this stack
              </CardTitle>
              <CardDescription className="text-sm leading-6">
                The Meera desktop flow is not only a frontend. It combines Node.js tooling, npm scripts, a React UI,
                Vite builds, Electron desktop packaging, and Python for backend and helper tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {stackExplainers.map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/60 bg-background/35 p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </AnimatedDiv>

        <div className="mt-12 grid gap-6 xl:grid-cols-2">
          <AnimatedDiv delay={0.22}>
            <Card className="h-full bg-card/55 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 font-headline text-2xl">
                  <TerminalSquare className="h-6 w-6 text-primary" />
                  desktop_frontend run and build flow
                </CardTitle>
                <CardDescription className="text-sm leading-6">
                  This is the main source package for the app. It is the one you use if you want to run MeeraAI
                  locally, inspect the UI code, or package the desktop application.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {frontendRunCommands.map((command) => (
                  <CommandBlock key={command.title} title={command.title} code={command.code} />
                ))}

                <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
                  <h3 className="text-lg font-semibold text-foreground">What the frontend scripts mean</h3>
                  <div className="mt-4 space-y-3">
                    {frontendScripts.map((script) => (
                      <p key={script} className="text-sm leading-6 text-foreground/90">
                        {script}
                      </p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedDiv>

          <AnimatedDiv delay={0.26}>
            <Card className="h-full bg-card/55 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 font-headline text-2xl">
                  <HardDriveDownload className="h-6 w-6 text-primary" />
                  installer packaging flow
                </CardTitle>
                <CardDescription className="text-sm leading-6">
                  The installer project is the second layer. It does not replace the frontend source. It packages the
                  built desktop app into the installer release flow expected by the current Electron builder setup.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {installerCommands.map((command) => (
                  <CommandBlock key={command.title} title={command.title} code={command.code} />
                ))}

                <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
                  <h3 className="text-lg font-semibold text-foreground">What the installer scripts mean</h3>
                  <div className="mt-4 space-y-3">
                    {installerScripts.map((script) => (
                      <p key={script} className="text-sm leading-6 text-foreground/90">
                        {script}
                      </p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedDiv>
        </div>

        <AnimatedDiv delay={0.3} className="mt-12">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card/70 to-accent/10 backdrop-blur-sm">
            <CardContent className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <CardTitle className="flex items-center gap-3 font-headline text-2xl">
                  <Workflow className="h-6 w-6 text-primary" />
                  Recommended order for users
                </CardTitle>
                <CardDescription className="mt-3 text-sm leading-6 text-muted-foreground">
                  If someone is trying to understand or run the app, they should start with the desktop frontend
                  source. If they want to create the installer package, they should then use the installer source
                  after the frontend release exists.
                </CardDescription>
                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl border border-border/60 bg-background/35 px-4 py-3 text-sm leading-6 text-foreground/90">
                    1. Download `meeraai-desktop-frontend-source.zip`
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/35 px-4 py-3 text-sm leading-6 text-foreground/90">
                    2. Extract it and run `npm install`
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/35 px-4 py-3 text-sm leading-6 text-foreground/90">
                    3. Start the backend, then use `npm run dev` for development or `npm run package` for packaging
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/35 px-4 py-3 text-sm leading-6 text-foreground/90">
                    4. Download `meeraai-installer-source.zip` only when the frontend release is already prepared
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-dashed border-primary/30 bg-background/35 p-6">
                <div className="flex h-full flex-col justify-between rounded-2xl border border-primary/10 bg-background/55 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-primary/80">Delivery Notes</p>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      These downloads are now wired to external JioAICloud source archives:
                    </p>
                    <div className="mt-4 space-y-3 text-sm text-foreground/90">
                      <div className="rounded-xl border border-border/60 bg-background/35 px-4 py-3">
                        `Desktop Frontend Source` hosted on JioAICloud
                      </div>
                      <div className="rounded-xl border border-border/60 bg-background/35 px-4 py-3">
                        `Installer Source` hosted on JioAICloud
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      Both packages were prepared as source-only handoff archives so users can inspect the codebase,
                      install dependencies with npm, and follow the build instructions shown on this page. The site now
                      forwards users to the external cloud-hosted files instead of bundling the ZIPs inside the Vercel deployment.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </AnimatedDiv>
      </div>
    </section>
  );
}
