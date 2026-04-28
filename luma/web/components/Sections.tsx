'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FEATURES } from '@/constants/config';

// ─── Shared animation variant ─────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: 'easeOut' },
  }),
};

// ─── SectionWrapper ───────────────────────────────────────────────────────────

export function SectionWrapper({
  id,
  className = '',
  children,
  backgroundColor = 'transparent',
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  backgroundColor?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.5 }}
      className={`section-padding ${className}`}
      style={{ backgroundColor }}
      aria-label={id}
    >
      {children}
    </motion.section>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

export function SectionHeader({
  eyebrow,
  title,
  highlight,
  subtitle,
  center = true,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-16 ${center ? 'text-center' : ''}`}>
      <span
        className="inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-4"
        style={{ backgroundColor: '#F3F0FF', color: '#6C5CE7', border: '1.5px solid #A29BFE' }}
      >
        {eyebrow}
      </span>
      <h2 className="text-4xl md:text-5xl font-black mb-4">
        {title}{' '}
        {highlight && <span className="gradient-text">{highlight}</span>}
      </h2>
      {subtitle && (
        <p className="text-xl max-w-2xl mx-auto" style={{ color: '#636E72' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── FeatureCard ──────────────────────────────────────────────────────────────

export function FeatureCard({
  emoji, title, description, color, accent, index,
}: {
  emoji: string;
  title: string;
  description: string;
  color: string;
  accent: string;
  index: number;
}) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="glass-card card-accent p-8 flex flex-col gap-4"
      aria-label={title}
    >
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        {emoji}
      </div>

      <div>
        <h3 className="text-xl font-bold mb-2" style={{ color: '#2D3436' }}>{title}</h3>
        <p className="leading-relaxed" style={{ color: '#636E72' }}>{description}</p>
      </div>

      <div
        className="mt-auto text-sm font-bold"
        style={{ color: accent }}
      >
        Learn more →
      </div>
    </motion.div>
  );
}

// ─── Features Section ─────────────────────────────────────────────────────────

export function Features() {
  return (
    <SectionWrapper id="features" backgroundColor="#F0F4F8">
      <div className="container-wide">
        <SectionHeader
          eyebrow="✨ What Makes LUMA Different"
          title="Everything your child needs to"
          highlight="love reading"
          subtitle="Built from the ground up for dyslexic learners — every feature has a reason."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} {...feature} index={i} />
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

import { HOW_IT_WORKS_STEPS } from '@/constants/config';

export function HowItWorks() {
  return (
    <SectionWrapper id="how-it-works" backgroundColor="#FDFBF7">
      <div className="container-wide">
        <SectionHeader
          eyebrow="📋 How It Works"
          title="Three simple steps to"
          highlight="brighter reading"
        />

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line on desktop */}
          <div
            className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 z-0"
            style={{ backgroundColor: '#E8E4DC' }}
            aria-hidden="true"
          />

          {HOW_IT_WORKS_STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              className="relative z-10 flex flex-col items-center text-center gap-4"
            >
              {/* Step circle */}
              <div
                className="w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-md"
                style={{ backgroundColor: step.color, border: '3px solid #E8E4DC' }}
              >
                <span className="text-2xl">{step.emoji}</span>
              </div>

              {/* Step number */}
              <span
                className="text-xs font-black tracking-widest"
                style={{ color: '#6C5CE7' }}
              >
                STEP {step.step}
              </span>

              <h3 className="text-xl font-bold">{step.title}</h3>
              <p style={{ color: '#636E72', lineHeight: 1.7 }}>{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── Benefits ─────────────────────────────────────────────────────────────────

import { BENEFITS } from '@/constants/config';

export function Benefits() {
  return (
    <SectionWrapper id="benefits" backgroundColor="#FFF5F0">
      <div className="container-wide">
        <SectionHeader
          eyebrow="💡 Why Parents Choose LUMA"
          title="Real results for"
          highlight="real families"
          subtitle="Every feature is designed to reduce stress and build genuine reading confidence."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFITS.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="glass-card p-7 flex gap-5"
            >
              <span className="text-3xl flex-shrink-0 mt-1">{benefit.emoji}</span>
              <div>
                <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#636E72' }}>
                  {benefit.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

import { TESTIMONIALS } from '@/constants/config';

function StarRating() {
  return (
    <div className="flex gap-0.5 mb-4" aria-label="5 star rating">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className="text-amber-400 text-lg">★</span>
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <SectionWrapper id="testimonials" backgroundColor="#F3F0FF">
      <div className="container-wide">
        <SectionHeader
          eyebrow="❤️ Parent Stories"
          title="Trusted by families"
          highlight="everywhere"
          subtitle="Hear from parents who've seen real change in their children's reading confidence."
        />

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <motion.blockquote
              key={t.name}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-60px' }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="glass-card p-8 flex flex-col gap-4"
              cite={t.name}
            >
              <StarRating />
              <p className="text-lg leading-relaxed italic" style={{ color: '#2D3436' }}>
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="flex items-center gap-3 mt-auto">
                <span className="text-3xl">{t.avatar}</span>
                <div>
                  <div className="font-bold text-sm" style={{ color: '#2D3436' }}>{t.name}</div>
                  <div className="text-xs" style={{ color: '#636E72' }}>{t.role}</div>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

export function CTASection() {
  return (
    <SectionWrapper id="cta" backgroundColor="#FDFBF7">
      <div className="container-mid text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="relative rounded-[32px] overflow-hidden p-12 md:p-20"
          style={{
            background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 50%, #FF9F43 100%)',
          }}
        >
          {/* Decorative blobs */}
          <div className="absolute inset-0 opacity-20" aria-hidden="true">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="text-5xl mb-6">⭐</div>
            <h2
              className="text-4xl md:text-5xl font-black mb-6 text-white"
              style={{ letterSpacing: '-0.03em' }}
            >
              Start Your Child&apos;s Reading
              <br />
              Journey Today
            </h2>
            <p className="text-xl mb-8 text-white/80 max-w-lg mx-auto leading-relaxed">
              Free to download. No subscription required to start.
              Join thousands of families helping their children discover the joy of reading.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="#"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all duration-200 hover:-translate-y-1"
                style={{ backgroundColor: '#FDFBF7', color: '#6C5CE7', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
              >
                🍎 App Store
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all duration-200 hover:-translate-y-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)' }}
              >
                🤖 Google Play
              </a>
            </div>

            <p className="mt-6 text-white/60 text-sm">
              Available on iOS 14+ and Android 8+
            </p>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  );
}
