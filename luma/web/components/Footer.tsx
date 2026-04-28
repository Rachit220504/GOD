import Link from 'next/link';
import { SITE_CONFIG, NAV_LINKS } from '@/constants/config';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'For Parents', href: '#testimonials' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
  Support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Us', href: `mailto:${SITE_CONFIG.email}` },
    { label: 'Accessibility', href: '/accessibility' },
  ],
} as const;

const SOCIAL = [
  { label: 'Twitter', emoji: '𝕏', href: '#' },
  { label: 'Instagram', emoji: '📸', href: '#' },
  { label: 'Facebook', emoji: '👥', href: '#' },
  { label: 'LinkedIn', emoji: '💼', href: '#' },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="border-t"
      style={{ backgroundColor: '#F0F4F8', borderColor: '#E8E4DC' }}
      aria-label="Site footer"
    >
      <div className="container-wide section-padding">
        <div className="grid md:grid-cols-5 gap-10 mb-12">
          {/* Brand column */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span
                className="text-2xl font-black gradient-text"
                style={{ letterSpacing: '-0.04em' }}
              >
                {SITE_CONFIG.name}
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#636E72' }}>
              {SITE_CONFIG.description}
            </p>

            {/* App store badges */}
            <div className="flex gap-3 mt-2">
              <a
                href={SITE_CONFIG.appStoreUrl}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: '#2D3436', color: '#FDFBF7' }}
                aria-label="Download on App Store"
              >
                🍎 App Store
              </a>
              <a
                href={SITE_CONFIG.playStoreUrl}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: '#2D3436', color: '#FDFBF7' }}
                aria-label="Download on Google Play"
              >
                🤖 Google Play
              </a>
            </div>

            {/* Social links */}
            <div className="flex gap-3 mt-1">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: '#E8E4DC', color: '#636E72' }}
                  aria-label={s.label}
                >
                  {s.emoji}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <nav key={group} aria-label={`${group} links`}>
              <h3 className="font-bold text-sm mb-4 tracking-wide" style={{ color: '#2D3436' }}>
                {group.toUpperCase()}
              </h3>
              <ul className="flex flex-col gap-2.5" role="list">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors duration-200 hover:text-[--purple]"
                      style={{ color: '#636E72' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4"
          style={{ borderColor: '#E8E4DC' }}
        >
          <p className="text-xs" style={{ color: '#B2BEC3' }}>
            © {year} {SITE_CONFIG.name}. All rights reserved. Made with ❤️ for every reader.
          </p>

          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: '#B2BEC3' }}>
              Designed for children with dyslexia —{' '}
            </span>
            <span className="text-xs font-bold" style={{ color: '#6C5CE7' }}>
              always accessible.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
