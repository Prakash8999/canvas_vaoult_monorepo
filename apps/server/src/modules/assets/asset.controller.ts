import { Request, Response, NextFunction } from "express";
import { errorHandler, successHandler } from "../../common/middlewares/responseHandler";
import { assetService } from "./asset.service";
import { createUploadMiddleware, MulterS3File } from "../../common/libs/multer/multer-s3";
import ImageAssets from "./asset.model";


export const dynamicUploadImages = (req: Request, res: Response, next: NextFunction) => {
	if (!req.user || !req.user.userId) {
		errorHandler(res, "Unauthorized: User information is missing", {}, 401);
		return;
	}

	const fileType = req.query?.fileType as string;
	const upload = createUploadMiddleware(req.user.userId, fileType);

	upload(req, res, function (err) {
		console.log('error ', err);
		if (err) {
			errorHandler(res, err.message, {}, 500);
			return
		}
		next();
		return
	});
};

/**
 * Handle image upload response
 */
export const handleUploadImages = async (req: Request, res: Response) => {
	try {
		const file = req.file as MulterS3File;
		if (!file) {
			return errorHandler(res, "No file uploaded", {}, 400);
		}


		// Additional validation for image files
		const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
		if (!allowedMimes.includes(file.mimetype)) {
			return errorHandler(res, "Only image files are allowed", {}, 400);
		}

		const uploadedFile = assetService.processUploadedFile(file);
		await ImageAssets.create({
			user_Id: req.user.userId,
			s3_key: uploadedFile.key,
			size_kb: Math.round(uploadedFile.size),
			file_type: file.mimetype,
			url: uploadedFile.url,
			file_name: file.originalname,
			created_at: new Date(),
			updated_at: new Date(),
		});

		return successHandler(res, "Image uploaded to S3 successfully", uploadedFile, 200);
	} catch (error: any) {
		console.error("Error uploading image:", error);
		return errorHandler(res, error.message || "Image upload failed", {}, 500);
	}
};

/**
 * Delete multiple S3 files
 */
export const deleteMultipleS3Files = async (req: Request, res: Response) => {
	try {
		const { keys } = req.body;

		if (!keys || !Array.isArray(keys) || keys.length === 0) {
			errorHandler(res, "Keys array is required", {}, 400);
			return;
		}

		const result = await assetService.deleteMultipleFiles(keys);
		successHandler(res, result.message, result, 200);
		return;
	} catch (error: any) {
		errorHandler(res, error.message || "Failed to delete files", {}, 500);
		return;
	}
};
