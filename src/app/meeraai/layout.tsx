import type { ReactNode } from 'react';
export default function MeeraAILayout({ children, modal }: { children: ReactNode; modal: ReactNode }) { return <>{children}{modal}</>; }
