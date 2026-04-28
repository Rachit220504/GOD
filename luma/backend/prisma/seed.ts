/// <reference types="node" />
import { PrismaClient, Role, ReadingLevel } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding LUMA database...');

  // ─── Educator ───────────────────────────────────────────────────────────────
  const educatorPassword = await bcrypt.hash('Educator@123', 12);
  const educator = await prisma.user.upsert({
    where: { email: 'educator@luma.app' },
    update: {},
    create: {
      email: 'educator@luma.app',
      passwordHash: educatorPassword,
      role: Role.EDUCATOR,
      isVerified: true,
      profile: {
        create: {
          displayName: 'Ms. Priya',
          age: 32,
          readingLevel: ReadingLevel.ADVANCED,
          fontSize: 18,
          letterSpacing: 0.08,
          lineHeight: 1.5,
          backgroundColor: '#F0F4F8',
          fontFamily: 'Lexend',
        },
      },
    },
    include: { profile: true },
  });
  console.log(`✅ Educator: ${educator.email}`);

  // ─── Parent ─────────────────────────────────────────────────────────────────
  const parentPassword = await bcrypt.hash('Parent@123', 12);
  const parent = await prisma.user.upsert({
    where: { email: 'parent@luma.app' },
    update: {},
    create: {
      email: 'parent@luma.app',
      passwordHash: parentPassword,
      role: Role.PARENT,
      isVerified: true,
      profile: {
        create: {
          displayName: 'Aarav\'s Mom',
          age: 35,
          readingLevel: ReadingLevel.ADVANCED,
          fontSize: 18,
          letterSpacing: 0.08,
          lineHeight: 1.5,
          backgroundColor: '#FDFBF7',
          fontFamily: 'Lexend',
        },
      },
    },
    include: { profile: true },
  });
  console.log(`✅ Parent: ${parent.email}`);

  // ─── Child ──────────────────────────────────────────────────────────────────
  const childPassword = await bcrypt.hash('Child@123', 12);
  const child = await prisma.user.upsert({
    where: { email: 'aarav@luma.app' },
    update: {},
    create: {
      email: 'aarav@luma.app',
      passwordHash: childPassword,
      role: Role.CHILD,
      isVerified: true,
      profile: {
        create: {
          displayName: 'Aarav',
          age: 8,
          readingLevel: ReadingLevel.ELEMENTARY,
          fontSize: 22,
          letterSpacing: 0.12,
          lineHeight: 1.6,
          backgroundColor: '#FFF5F0',
          fontFamily: 'OpenDyslexic',
          totalPoints: 45,
          currentStreak: 3,
          longestStreak: 5,
          booksCompleted: 2,
        },
      },
    },
    include: { profile: true },
  });
  console.log(`✅ Child: ${child.email}`);

  // ─── Link child to parent ───────────────────────────────────────────────────
  await prisma.childProfile.upsert({
    where: { childId: child.id },
    update: {},
    create: { childId: child.id, parentId: parent.id },
  });
  console.log('✅ Child linked to parent');

  // ─── Seed sample story ──────────────────────────────────────────────────────
  const story = await prisma.generatedContent.upsert({
    where: { id: 'seed-story-00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: 'seed-story-00000000-0000-0000-0000-000000000001',
      createdById: educator.id,
      title: 'The Brave Little Cloud',
      body: `Once there was a small cloud.\nHe lived in the big blue sky.\nHis name was Nim.\n\nNim was scared of thunder.\nHe hid behind the tall hills.\nBut one day, the sun was too hot.\n\nNim flew up high.\nHe made soft rain for the dry land.\nAll the plants said thank you.\n\nNim smiled.\nHe was not scared any more.\nHe was brave.`,
      syllableMap: [
        { word: 'little', syllables: ['lit', 'tle'], chunks: ['lit', 'tle'], pronunciation: 'LIT-ul' },
        { word: 'thunder', syllables: ['thun', 'der'], chunks: ['thun', 'der'], pronunciation: 'THUN-der' },
        { word: 'behind', syllables: ['be', 'hind'], chunks: ['be', 'hind'], pronunciation: 'beh-HIND' },
        { word: 'scared', syllables: ['scared'], chunks: ['scared'], pronunciation: 'SKAYRD' },
        { word: 'anymore', syllables: ['a', 'ny', 'more'], chunks: ['a', 'ny', 'more'], pronunciation: 'a-nee-MORE' },
      ],
      readingLevel: ReadingLevel.ELEMENTARY,
      topic: 'weather and bravery',
      ageGroup: '7-9',
      wordCount: 82,
      estimatedMins: 2,
      tags: ['bravery', 'weather', 'nature', 'feelings'],
      status: 'PUBLISHED',
    },
  });
  console.log(`✅ Sample story: "${story.title}"`);

  // ─── Seed a sample session for the child ───────────────────────────────────
  const existingSession = await prisma.sessionProgress.findFirst({
    where: { userId: child.id, contentId: story.id },
  });

  if (!existingSession) {
    await prisma.sessionProgress.create({
      data: {
        userId: child.id,
        contentId: story.id,
        wordsRead: 82,
        wordsPerMinute: 65,
        accuracyPercent: 88,
        completionPct: 100,
        durationSeconds: 75,
        helpRequestCount: 2,
        fontSizeUsed: 22,
        letterSpacingUsed: 0.12,
        lineHeightUsed: 1.6,
        backgroundColorUsed: '#FFF5F0',
        finishedAt: new Date(),
      },
    });
    console.log('✅ Sample session recorded for Aarav');
  }

  console.log('\n🎉 Seeding complete!\n');
  console.log('  Accounts:');
  console.log('  → educator@luma.app  / Educator@123');
  console.log('  → parent@luma.app    / Parent@123');
  console.log('  → aarav@luma.app     / Child@123');
}

main()
  .catch((e: unknown) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
