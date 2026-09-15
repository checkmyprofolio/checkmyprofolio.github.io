import NextImage from 'next/image';
import type { ComponentProps } from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Keep empty screenshot slots readable without depending on an image request.
// Supplying a real screenshot path automatically restores the normal image.
export function MeeraImage(props: ComponentProps<typeof NextImage>) {
 const { src, alt, fill, width, height, className } = props;
 if (typeof src !== 'string' || !src.startsWith('/meeraai/placeholders/')) return <NextImage {...props} />;
 const slot = src.split('/').pop()?.split('.')[0];
 const title = ({app:'MeeraAI desktop app',browser:'Meera Browser',models:'Model library',settings:'Runtime settings'} as Record<string,string>)[slot || ''] || 'MeeraAI';
 return <div role="img" aria-label={alt} className={cn(
  'flex w-full flex-col items-center justify-center gap-2 overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(56,189,248,0.12),transparent_65%),linear-gradient(135deg,#0c1931,#07101c)] text-center',
  fill && 'absolute inset-0 h-full', className,
 )} style={!fill && width && height ? {aspectRatio:`${width} / ${height}`} : undefined}>
  <ImageIcon aria-hidden="true" className="h-6 w-6 shrink-0 text-sky-300/60" />
  <span className="px-3 text-[clamp(0.7rem,1vw,1rem)] font-medium text-slate-200">{title}</span>
  <span className="px-3 text-[0.6rem] text-slate-400">Screenshot to be added</span>
 </div>;
}
