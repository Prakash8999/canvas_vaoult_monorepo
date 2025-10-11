import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { s3Client } from "../../common/libs/s3/s3-client";

export interface UploadedFile {
  size: number;
  url: string;
  key: string;
}

export interface DeleteFilesResult {
  success: boolean;
  message: string;
}

export class AssetService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = s3Client;
  }

  /**
   * Delete multiple files from S3
   */
  async deleteMultipleFiles(keys: string[]): Promise<DeleteFilesResult> {
    try {
      const deletePromises = keys.map(async (key) => {
        const command = new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: key,
        });

        const response = await this.s3Client.send(command);

        if (response.$metadata.httpStatusCode !== 204) {
          throw new Error(`Failed to delete file: ${key}`);
        }
      });

      await Promise.all(deletePromises);

      return { success: true, message: "All files deleted successfully" };
    } catch (error) {
      console.error("Error deleting multiple files:", error);
      throw new Error("Failed to delete one or more files from S3");
    }
  }

  /**
   * Process uploaded files and return formatted response
   */
  processUploadedFiles(files: Express.Multer.File[]): UploadedFile[] {
    if (!files || files.length === 0) {
      throw new Error("No files uploaded");
    }

    return files.map((file: any) => ({
      size: +(file.size / 1024).toFixed(2), // Size in KB
      url: file.location,
      key: file.key,
    }));
  }

  /**
   * Process single uploaded file and return formatted response
   */
  processUploadedFile(file: Express.Multer.File): UploadedFile {
    if (!file) {
      throw new Error("No file uploaded");
    }

    return {
      size: +(file.size / 1024).toFixed(2), // Size in KB
      url: (file as any).location,
      key: (file as any).key,
    };
  }
}

export const assetService = new AssetService();