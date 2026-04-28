import { ReadingLevel } from '@prisma/client';
import { prisma } from '../../config/database';
import { logger } from '../../config/logger';
import { AppError } from '../../middleware/errorHandler';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UpdateProfileInput {
  displayName?: string;
  age?: number;
  readingLevel?: ReadingLevel;
  avatarUrl?: string;
  // Reading Comfort
  fontSize?: number;
  letterSpacing?: number;
  lineHeight?: number;
  backgroundColor?: string;
  fontFamily?: string;
}

export interface ProfileResponse {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  age: number | null;
  readingLevel: ReadingLevel;
  // Reading Comfort
  fontSize: number;
  letterSpacing: number;
  lineHeight: number;
  backgroundColor: string;
  fontFamily: string;
  // Gamification
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  booksCompleted: number;
  // Child links (if parent)
  children?: LinkedChild[];
}

interface LinkedChild {
  id: string;
  email: string;
  displayName: string;
  readingLevel: ReadingLevel;
  totalPoints: number;
  currentStreak: number;
  booksCompleted: number;
}

// ─── Profile Service ──────────────────────────────────────────────────────────

export class ProfileService {
  async getProfile(userId: string, requesterId: string, requesterRole: string): Promise<ProfileResponse> {
    // Access control: users can read own profile; parents can read linked children's profiles
    await this.assertAccess(userId, requesterId, requesterRole);

    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (!profile) throw new AppError('Profile not found.', 404);

    // If requester is a PARENT, fetch their linked children
    let children: LinkedChild[] | undefined;
    if (requesterRole === 'PARENT' && userId === requesterId) {
      children = await this.getLinkedChildren(requesterId);
    }

    return { ...profile, children };
  }

  async updateProfile(
    userId: string,
    requesterId: string,
    requesterRole: string,
    input: UpdateProfileInput,
  ): Promise<ProfileResponse> {
    await this.assertAccess(userId, requesterId, requesterRole);

    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) throw new AppError('Profile not found.', 404);

    const updated = await prisma.profile.update({
      where: { userId },
      data: {
        ...(input.displayName !== undefined && { displayName: input.displayName }),
        ...(input.age !== undefined && { age: input.age }),
        ...(input.readingLevel !== undefined && { readingLevel: input.readingLevel }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
        ...(input.fontSize !== undefined && { fontSize: input.fontSize }),
        ...(input.letterSpacing !== undefined && { letterSpacing: input.letterSpacing }),
        ...(input.lineHeight !== undefined && { lineHeight: input.lineHeight }),
        ...(input.backgroundColor !== undefined && { backgroundColor: input.backgroundColor }),
        ...(input.fontFamily !== undefined && { fontFamily: input.fontFamily }),
      },
    });

    logger.info(`Profile updated for user ${userId}`);

    let children: LinkedChild[] | undefined;
    if (requesterRole === 'PARENT' && userId === requesterId) {
      children = await this.getLinkedChildren(requesterId);
    }

    return { ...updated, children };
  }

  async linkChild(parentId: string, childEmail: string): Promise<{ message: string }> {
    const child = await prisma.user.findUnique({
      where: { email: childEmail },
      select: { id: true, role: true },
    });

    if (!child) throw new AppError('No user found with that email address.', 404);
    if (child.role !== 'CHILD') {
      throw new AppError('The specified user is not registered as a child account.', 400);
    }
    if (child.id === parentId) {
      throw new AppError('You cannot link yourself as a child.', 400);
    }

    // Check not already linked
    const existingLink = await prisma.childProfile.findUnique({
      where: { childId: child.id },
    });
    if (existingLink) {
      if (existingLink.parentId === parentId) {
        throw new AppError('This child is already linked to your account.', 409);
      }
      throw new AppError('This child account is already linked to another parent.', 409);
    }

    await prisma.childProfile.create({
      data: { childId: child.id, parentId },
    });

    logger.info(`Parent ${parentId} linked child ${child.id}`);
    return { message: 'Child account linked successfully.' };
  }

  async getLinkedChildren(parentId: string): Promise<LinkedChild[]> {
    const links = await prisma.childProfile.findMany({
      where: { parentId },
      include: {
        child: {
          include: { profile: true },
        },
      },
    });

    return links.map((link) => ({
      id: link.child.id,
      email: link.child.email,
      displayName: link.child.profile?.displayName ?? link.child.email,
      readingLevel: link.child.profile?.readingLevel ?? 'BEGINNER',
      totalPoints: link.child.profile?.totalPoints ?? 0,
      currentStreak: link.child.profile?.currentStreak ?? 0,
      booksCompleted: link.child.profile?.booksCompleted ?? 0,
    }));
  }

  private async assertAccess(
    targetUserId: string,
    requesterId: string,
    requesterRole: string,
  ): Promise<void> {
    // Own profile: always allowed
    if (targetUserId === requesterId) return;

    // Educator: can view any profile
    if (requesterRole === 'EDUCATOR') return;

    // Parent: can access linked children's profiles
    if (requesterRole === 'PARENT') {
      const link = await prisma.childProfile.findFirst({
        where: { parentId: requesterId, childId: targetUserId },
      });
      if (link) return;
    }

    throw new AppError('You do not have permission to access this profile.', 403);
  }
}

export const profileService = new ProfileService();
