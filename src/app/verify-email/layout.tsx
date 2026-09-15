
import type { Metadata } from 'next';
import { ReactNode } from "react";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyEmailLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}
