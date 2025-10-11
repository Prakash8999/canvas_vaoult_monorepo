import { Router } from 'express';
import * as assetController from './asset.controller';
import { authUser } from '../../common/middlewares/auth';

const router = Router();

// All asset routes require authentication
router.use(authUser);

// Upload single image (only image files allowed)
router.post('/upload', assetController.dynamicUploadImages, assetController.handleUploadImages);

// Delete multiple files
router.delete('/delete', assetController.deleteMultipleS3Files);

export default router;