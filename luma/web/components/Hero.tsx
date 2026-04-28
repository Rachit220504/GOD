'use client';

import { motion } from 'framer-motion';
import { SITE_CONFIG } from '@/constants/config';

// ─── App Mockup ───────────────────────────────────────────────────────────────

function AppMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
      className="relative mx-auto"
      style={{ maxWidth: 320 }}
    >
      {/* Glow behind phone */}
      <div
        className="absolute inset-0 rounded-[40px] blur-3xl opacity-30 -z-10"
        style={{ background: 'radial-gradient(circle, #6C5CE7 0%, #A29BFE 50%, transparent 100%)', transform: 'scale(1.2)' }}
      />

      {/* Phone frame */}
      <div
        className="relative rounded-[36px] overflow-hidden shadow-2xl border-4"
        style={{ borderColor: '#E8E4DC', backgroundColor: '#FDFBF7', aspectRatio: '9/18' }}
      >
        {/* Status bar */}
        <div className="flex justify-between items-center px-6 py-3 bg-[#F3F0FF]">
          <span className="text-xs font-bold text-[#6C5CE7]">9:41</span>
          <div className="w-20 h-2 bg-[#6C5CE7]/20 rounded-full" />
          <span className="text-xs font-bold text-[#6C5CE7]">●●●</span>
        </div>

        {/* Story header */}
        <div className="px-5 py-4" style={{ backgroundColor: '#F3F0FF' }}>
          <div className="text-2xl mb-1">📖</div>
          <div className="text-sm font-black text-[#2D3436] leading-tight">The Dragon Who Lost His Fire</div>
          <div className="flex gap-2 mt-2">
            {['🌱 Beginner', '⏱ 3 min'].map(s => (
              <span key={s} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 text-[#636E72]">{s}</span>
            ))}
          </div>
        </div>

        {/* Story text with syllable highlight */}
        <div className="px-5 py-4 flex-1" style={{ backgroundColor: '#FDFBF7' }}>
          <p className="text-sm leading-relaxed text-[#2D3436] font-medium" style={{ letterSpacing: '0.04em', lineHeight: 2 }}>
            Once there was a{' '}
            <span className="inline-block">
              <span
                className="text-[#6C5CE7] font-bold border-b-2"
                style={{ borderColor: '#A29BFE' }}
              >
                drag·on
              </span>
            </span>
            {' '}who lived on a big green hill. Every{' '}
            <span
              className="text-[#6C5CE7] font-bold border-b-2"
              style={{ borderColor: '#A29BFE' }}
            >
              morn·ing
            </span>
            {' '}he would fly up to the clouds...
          </p>

          {/* Word breakdown popup */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.4, ease: 'backOut' }}
            className="mt-4 rounded-2xl p-3 shadow-lg"
            style={{ backgroundColor: '#fff', border: '1.5px solid #E8E4DC' }}
          >
            <div className="text-[10px] font-bold text-[#636E72] mb-2">✨ Word Breakdown</div>
            <div className="flex gap-2 mb-2">
              {['drag', 'on'].map((syl, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-xl text-sm font-black text-white shadow-sm"
                  style={{ backgroundColor: i === 0 ? '#6C5CE7' : '#FF9F43' }}
                >
                  {syl}
                </span>
              ))}
            </div>
            <div className="text-[10px] text-[#636E72]">🗣 Say: drag · on</div>
          </motion.div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="h-1.5 bg-[#E8E4DC]">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: '#6C5CE7' }}
              initial={{ width: '0%' }}
              animate={{ width: '35%' }}
              transition={{ delay: 0.8, duration: 1.2, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="absolute -left-10 top-1/4 glass-card px-4 py-2 shadow-lg"
      >
        <div className="text-xs font-bold text-[#2D3436]">🔥 5 Day Streak!</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.6, duration: 0.5 }}
        className="absolute -right-8 top-1/2 glass-card px-4 py-2 shadow-lg"
      >
        <div className="text-xs font-bold text-[#2D3436]">⭐ +50 Points</div>
      </motion.div>
    </motion.div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ backgroundColor: '#FDFBF7' }}
      aria-labelledby="hero-heading"
    >
      {/* Decorative blobs */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 -z-0 blur-3xl"
        style={{ background: 'radial-gradient(circle, #6C5CE7 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-15 -z-0 blur-3xl"
        style={{ background: 'radial-gradient(circle, #FF9F43 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}
        aria-hidden="true"
      />

      <div className="container-wide section-padding w-full relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left — copy */}
          <div>
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 mb-6"
            >
              <span
                className="px-4 py-1.5 rounded-full text-sm font-bold"
                style={{ backgroundColor: '#F3F0FF', color: '#6C5CE7', border: '1.5px solid #A29BFE' }}
              >
                ✨ AI-Powered Reading for Children
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              id="hero-heading"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.05]"
            >
              A Brighter Way
              <br />
              to{' '}
              <span className="gradient-text">Read</span>
              <br />
              for Every Child
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl mb-8 leading-relaxed max-w-lg"
              style={{ color: '#636E72', letterSpacing: '0.01em' }}
            >
              LUMA gives every child with dyslexia a personalised reading companion —
              AI stories, syllable help, and parent insights all in one calming app.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="flex flex-wrap gap-4 mb-10"
            >
              <a href={SITE_CONFIG.appStoreUrl} className="btn-primary text-lg px-8 py-4">
                📱 Download Free
              </a>
              <a href="#how-it-works" className="btn-secondary text-lg px-8 py-4">
                See How It Works →
              </a>
            </motion.div>

            {/* Social proof row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="flex items-center gap-6 flex-wrap"
            >
              {[
                { emoji: '👶', label: '10,000+ young readers' },
                { emoji: '⭐', label: '4.9 App Store rating' },
                { emoji: '🔒', label: 'No ads. Ever.' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-sm font-semibold" style={{ color: '#636E72' }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — app mockup */}
          <div className="flex justify-center md:justify-end">
            <AppMockup />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        aria-hidden="true"
      >
        <span className="text-xs font-semibold" style={{ color: '#B2BEC3' }}>Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className="w-1 h-6 rounded-full"
          style={{ backgroundColor: '#B2BEC3' }}
        />
      </motion.div>
    </section>
  );
}
