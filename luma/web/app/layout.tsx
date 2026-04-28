import type { Metadata } from 'next';
import { Lexend } from 'next/font/google';
import './globals.css';
import { SITE_CONFIG } from '@/constants/config';

const lexend = Lexend({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-lexend',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
  description: SITE_CONFIG.description,
  keywords: [
    'dyslexia reading app', 'reading help for children', 'AI reading app',
    'dyslexia tools', 'children reading app', 'phonics app', 'LUMA reading',
  ],
  authors: [{ name: 'LUMA Team', url: SITE_CONFIG.url }],
  openGraph: {
    type: 'website',
    url: SITE_CONFIG.url,
    title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'LUMA — A Brighter Way to Read',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE_CONFIG.twitter,
    title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
  },
  metadataBase: new URL(SITE_CONFIG.url),
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.ico', apple: '/apple-icon.png' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={lexend.variable}>
      <body className="font-lexend antialiased" style={{ backgroundColor: '#FDFBF7' }}>
        {children}
      </body>
    </html>
  );
}
