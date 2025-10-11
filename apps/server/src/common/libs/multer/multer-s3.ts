import multer from "multer";
import multerS3 from "multer-s3";
import { Request } from "express";
import { s3Client } from "../s3/s3-client";

console.log("S3 envs:", {
  bucket: process.env.S3_BUCKET,
  region: process.env.S3_REGION,
  key: process.env.S3_ACCESS_KEY,
  secret: process.env.S3_SECRET_KEY ? "***" : "MISSING"
});
if (!process.env.S3_BUCKET ||
    !process.env.S3_REGION ||
    !process.env.S3_ACCESS_KEY ||
    !process.env.S3_SECRET_KEY ||
    process.env.S3_BUCKET.trim() === "" ||
    process.env.S3_REGION.trim() === "" ||
    process.env.S3_ACCESS_KEY.trim() === "" ||
    process.env.S3_SECRET_KEY.trim() === "") {
	throw new Error("S3 environment variables are not properly configured");
}

export interface MulterS3File extends Express.Multer.File {
	location: string;
	key: string;
	bucket: string;
	acl: string;
	contentType: string;
	contentDisposition: string | null;
	contentEncoding: string | null;
	storageClass: string;
	serverSideEncryption: string | null;
	metadata: { fieldname: string };
	etag: string;
	versionId?: string;
}

export interface MulterRequest extends Request {
	files: MulterS3File[];
}

/**
 * Create S3 storage configuration for multer
 */
export const createS3Storage = (userId: number, fileType?: string) => {
	return multerS3({
		s3: s3Client,
		bucket: process.env.S3_BUCKET as string,
		// acl: "public-read",
		metadata: (req, file, cb) => {
			cb(null, { fieldname: file.fieldname });
		},
		key: (req: Request, file, cb) => {
			console.log("fileType", req.body?.fileType, req.query?.fileType, fileType);
			const type = fileType || (req.query?.fileType as string) || (req.body?.fileType as string);

			if (!type) {
				cb(new Error("File type is required. Must be 'note' or 'canvas'"));
				return;
			}

			if (!['note', 'notes', 'canvas'].includes(type)) {
				cb(new Error("Invalid file type. Must be 'note' or 'canvas'"));
				return;
			}

			const timestamp = Date.now();
			const sanitizedFileName = `${timestamp}_${file.fieldname}_${file.originalname}`;

			let folderPath = `uploads/user/${userId}/`;

			if (type === "notes" || type === "note") {
				folderPath += "notes/image/";
			} else if (type === "canvas") {
				folderPath += "canvas/image/";
			} else {
				cb(new Error("Invalid file type. Must be 'note' or 'canvas'"));
				return;
			}

			cb(null, `${folderPath}${sanitizedFileName}`);
		}
	});
};

/**
 * File filter function - only allows image files
 */
export const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Define allowed image MIME types
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];

  // Define allowed file extensions
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

  // Check if MIME type is allowed
  const isAllowedMimeType = allowedMimes.includes(file.mimetype);

  // Check if file extension is allowed
  const isAllowedExtension = allowedExtensions.includes(fileExtension);

  if (isAllowedMimeType && isAllowedExtension) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed'));
  }
};

/**
 * Create multer upload middleware
 */
export const createUploadMiddleware = (userId: number, fileType?: string, maxFileSize = 5 * 1024 * 1024) => {
	return multer({
		storage: createS3Storage(userId, fileType),
		fileFilter,
		limits: {
			fileSize: maxFileSize, // Default 5MB
			files: 1, // Only allow single file upload
		},
	}).single("image"); // Changed from .array() to .single()
};