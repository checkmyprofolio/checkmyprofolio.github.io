export const PORTFOLIO_ORIGIN = 'https://checkmyprofolio.github.io';

export const PORTFOLIO_LINKS = {
  portfolio: PORTFOLIO_ORIGIN,
  github: 'https://github.com/viditshah5656',
  linkedin: 'https://www.linkedin.com/in/viditshah5656/',
  orcid: 'https://orcid.org/0009-0009-0658-6157',
  email: 'mailto:viditshah5656@gmail.com',
  emailAddress: 'viditshah5656@gmail.com',
  binanceCli: 'https://github.com/viditshah5656/binance-futures-trading-bot',
  infera: 'https://github.com/viditshah5656/Infera',
  aerosynth3d: 'https://github.com/viditshah5656/single_pass_3D',
} as const;

export const PORTFOLIO_ROUTES = {
  home: '/home',
  dashboard: '/dashboard',
  projects: '/projects',
  contact: '/contact',
  profile: '/profile',
  meeraAI: '/meeraai',
} as const;

const URL_ALIASES: Record<string, string> = {
  'https://github.com/vidit-shah': PORTFOLIO_LINKS.github,
  'https://github.com/vidit-shah/': PORTFOLIO_LINKS.github,
  'https://www.linkedin.com/in/rockstar5656': PORTFOLIO_LINKS.linkedin,
  'https://www.linkedin.com/in/rockstar5656/': PORTFOLIO_LINKS.linkedin,
  'https://linkedin.com/in/rockstar5656': PORTFOLIO_LINKS.linkedin,
  'https://linkedin.com/in/rockstar5656/': PORTFOLIO_LINKS.linkedin,
  'https://checkmyprofolio.vercel.app': PORTFOLIO_ORIGIN,
  'https://checkmyprofolio.vercel.app/': PORTFOLIO_ORIGIN,
};

export function canonicalizePortfolioUrl(value: string): string {
  const raw = value.trim();
  const stripped = raw.replace(/[),.;!?]+$/g, '');
  if (URL_ALIASES[stripped]) return URL_ALIASES[stripped];

  try {
    const url = new URL(stripped);
    if (url.hostname === 'checkmyprofolio.vercel.app') {
      return PORTFOLIO_ORIGIN + (url.pathname === '/' ? '/' : url.pathname) + url.search + url.hash;
    }
    if (
      url.hostname === 'github.com' &&
      (url.pathname === '/vidit-shah' || url.pathname === '/vidit-shah/')
    ) {
      return PORTFOLIO_LINKS.github;
    }
    if (
      /^(?:www\.)?linkedin\.com$/.test(url.hostname) &&
      /^\/in\/rockstar5656\/?$/i.test(url.pathname)
    ) {
      return PORTFOLIO_LINKS.linkedin;
    }
  } catch {
    // Leave non-URL text unchanged.
  }

  return stripped;
}

export function isTrustedPortfolioUrl(value: string): boolean {
  const url = canonicalizePortfolioUrl(value);
  if (url.startsWith('mailto:')) return url === PORTFOLIO_LINKS.email;

  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'checkmyprofolio.github.io') return true;
    if (parsed.hostname === 'github.com') {
      const allowedPaths = new Set([
        '/viditshah5656',
        '/viditshah5656/binance-futures-trading-bot',
        '/viditshah5656/Infera',
        '/viditshah5656/single_pass_3D',
        '/checkmyprofolio/checkmyprofolio.github.io',
      ]);
      return allowedPaths.has(parsed.pathname.replace(/\/$/, ''));
    }
    if (parsed.hostname === 'www.linkedin.com' && parsed.pathname === '/in/viditshah5656/') return true;
    if (parsed.hostname === 'linkedin.com' && parsed.pathname === '/in/viditshah5656/') return true;
    if (parsed.hostname === 'orcid.org' && parsed.pathname === '/0009-0009-0658-6157') return true;
    return false;
  } catch {
    return false;
  }
}
