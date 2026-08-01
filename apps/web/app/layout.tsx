import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers/Providers';
import { CommandPalette } from '@/components/ui/CommandPalette.js';
import { FloatingAiAssistant } from '@/components/ai/FloatingAiAssistant.js';

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
});

export const metadata: Metadata = {
  title: 'ComplianceOS AI',
  description: 'AI-powered Sustainability, ESG, Carbon & Compliance Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={geist.variable}>
      <body className="bg-app text-app antialiased">
        <Providers>
          {children}
          <CommandPalette />
          <FloatingAiAssistant />
        </Providers>
      </body>
    </html>
  );
}
