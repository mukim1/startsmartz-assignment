import express from 'express';
import {
  initializeUpload,
  getUploadUrl,
  completePart,
  completeUpload,
  abortUpload,
  getUserVideos,
  deleteVideo,
  getVideoById,
} from '../controllers/videoController';
import { protect } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';
import {
  initUploadSchema,
  getUploadUrlSchema,
  completePartSchema,
  completeUploadSchema,
  deleteVideoSchema,
} from '../validation/schemas';

const router = express.Router();

// All routes are protected
router.use(protect);

// Video upload routes
router.post('/init-upload', validate(initUploadSchema), initializeUpload);
router.get('/upload-url', validate(getUploadUrlSchema), getUploadUrl);
router.post('/complete-part', validate(completePartSchema), completePart);
router.post('/complete-upload', validate(completeUploadSchema), completeUpload);
router.delete('/abort-upload/:id', abortUpload);

// Video management routes
router.get('/me', getUserVideos);
router.get('/:id', getVideoById);
router.delete('/:id', deleteVideo);

export default router;