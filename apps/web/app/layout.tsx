import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers/Providers';

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
});

/**
 * Root layout for the ComplianceOS AI web app.
 */
export const metadata: Metadata = {
  title: 'ComplianceOS AI',
  description: 'Enterprise compliance management platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={geist.variable}>
      <body className="bg-app text-app antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
