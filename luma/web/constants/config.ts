// ─── LUMA Web — Design Tokens & Site Config ───────────────────────────────────

export const COLORS = {
  cream: '#FDFBF7',
  softBlue: '#F0F4F8',
  softPeach: '#FFF5F0',
  lavender: '#F3F0FF',
  mint: '#F0FFF4',
  purple: '#6C5CE7',
  purpleLight: '#A29BFE',
  orange: '#FF9F43',
  orangeLight: '#FFEAA7',
  textPrimary: '#2D3436',
  textSecondary: '#636E72',
  textMuted: '#B2BEC3',
  white: '#FEFEFE',
  border: '#E8E4DC',
  success: '#00B894',
} as const;

export const SITE_CONFIG = {
  name: 'LUMA',
  tagline: 'A Brighter Way to Read',
  description:
    'LUMA is an AI-powered reading companion for children with dyslexia. Adaptive stories, syllable breakdowns, and real-time parent insights — all in one dyslexia-first app.',
  url: 'https://luma-reading.app',
  twitter: '@luma_reading',
  appStoreUrl: '#',
  playStoreUrl: '#',
  email: 'hello@luma-reading.app',
} as const;

export const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Benefits', href: '#benefits' },
  { label: 'For Parents', href: '#testimonials' },
] as const;

export const FEATURES = [
  {
    emoji: '✨',
    title: 'AI Story Generation',
    description:
      'Our AI writes personalised stories on any topic your child loves — from dragons to football — perfectly matched to their reading level.',
    color: COLORS.lavender,
    accent: COLORS.purple,
  },
  {
    emoji: '📖',
    title: 'Dyslexia-First Reading',
    description:
      'Every story is displayed with adjustable font size, letter spacing, and pastel backgrounds. Tap any tricky word to see it broken into syllables.',
    color: COLORS.softBlue,
    accent: COLORS.purpleLight,
  },
  {
    emoji: '📊',
    title: 'Parent Analytics',
    description:
      'Track reading speed, accuracy, streak, and skills over time. Get AI-personalised tips on how to support your child at home.',
    color: COLORS.softPeach,
    accent: COLORS.orange,
  },
  {
    emoji: '🧠',
    title: 'Adaptive Learning',
    description:
      'LUMA learns your child\'s reading patterns and adjusts story complexity automatically — always the right challenge, never overwhelming.',
    color: COLORS.mint,
    accent: COLORS.success,
  },
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    emoji: '👶',
    title: 'Your Child Reads',
    description:
      'Choose a topic, pick a story length, and start reading. Tap any word for an instant syllable breakdown. No pressure, no timer.',
    color: COLORS.lavender,
  },
  {
    step: '02',
    emoji: '🤖',
    title: 'AI Adapts',
    description:
      'LUMA tracks how your child reads and creates new stories that match their evolving confidence — getting just a little harder each time.',
    color: COLORS.softPeach,
  },
  {
    step: '03',
    emoji: '👩‍👦',
    title: 'You Track Progress',
    description:
      'Open the Parent Dashboard to see charts, skill scores, and personalised reading tips. Know exactly where to focus your support.',
    color: COLORS.softBlue,
  },
] as const;

export const BENEFITS = [
  {
    emoji: '💪',
    title: 'Improved Reading Confidence',
    description: 'Children who use LUMA for 3+ weeks report feeling more confident tackling new words independently.',
  },
  {
    emoji: '😌',
    title: 'Less Frustration',
    description: 'Pastel backgrounds, adjustable text, and syllable help means reading feels comfortable — not stressful.',
  },
  {
    emoji: '🎯',
    title: 'Personalised Learning',
    description: 'Every story, every setting, every AI tip is tailored to your individual child. No two journeys are the same.',
  },
  {
    emoji: '🔥',
    title: 'Daily Reading Streaks',
    description: 'Points, badges, and streaks make reading feel like a game — children look forward to their daily story.',
  },
  {
    emoji: '🔒',
    title: 'Safe & Private',
    description: 'No ads. No tracking. Your child\'s data stays yours. LUMA is designed for families who care about privacy.',
  },
  {
    emoji: '📱',
    title: 'Works Anywhere',
    description: 'Available on iOS and Android. Read at home, in the car, or at school — wherever feels right.',
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      'My son was afraid of reading. After three weeks with LUMA, he\'s asking for stories at bedtime. It\'s nothing short of a miracle.',
    name: 'Sarah M.',
    role: 'Parent of a 7-year-old',
    avatar: '👩',
  },
  {
    quote:
      'The syllable breakdown feature is brilliant. My daughter taps words herself now instead of giving up. Her confidence has completely changed.',
    name: 'James K.',
    role: 'Parent of a 9-year-old with dyslexia',
    avatar: '👨',
  },
  {
    quote:
      'As a teacher I recommend LUMA to all my students. The parent dashboard gives families real insight — not just "your child is doing fine."',
    name: 'Ms. Priya R.',
    role: 'Primary School Teacher',
    avatar: '👩‍🏫',
  },
] as const;
