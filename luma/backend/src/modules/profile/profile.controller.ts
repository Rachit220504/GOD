import { Request, Response, NextFunction } from 'express';
import { profileService } from './profile.service';

export class ProfileController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params['userId']);
      const profile = await profileService.getProfile(
        userId,
        req.user!.id,
        req.user!.role,
      );
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = String(req.params['userId']);
      const profile = await profileService.updateProfile(
        userId,
        req.user!.id,
        req.user!.role,
        req.body,
      );
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  async linkChild(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await profileService.linkChild(req.user!.id, req.body.childEmail);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async getMyChildren(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const children = await profileService.getLinkedChildren(req.user!.id);
      res.status(200).json({ success: true, data: children });
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
