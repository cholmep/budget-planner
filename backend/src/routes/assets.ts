import express, { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { validateAsset, validateBalance } from '../middleware/validation';
import {
  getAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  addBalance,
  deleteBalance
} from '../controllers/assetController';

const router: Router = express.Router();

// Helper function to wrap async handlers
const asyncHandler = (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next);
  };
};

// Protect all routes
router.use(authMiddleware);

// Asset routes
router.get('/', asyncHandler(getAssets));
router.get('/:id', asyncHandler(getAsset));
router.post('/', validateAsset(true), asyncHandler(createAsset));
router.put('/:id', validateAsset(false), asyncHandler(updateAsset));
router.delete('/:id', asyncHandler(deleteAsset));

// Balance history routes
router.post('/:id/balances', validateBalance, asyncHandler(addBalance));
router.delete('/:assetId/balances/:balanceId', asyncHandler(deleteBalance));

export default router; 