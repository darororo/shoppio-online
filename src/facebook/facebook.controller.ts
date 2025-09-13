import { Controller, Post, Body, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FacebookService, FacebookUploadResult } from './facebook.service';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Controller('facebook')
export class FacebookController {
  constructor(private readonly facebookService: FacebookService) {}

  @Post('upload-file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: MulterFile,
    @Body('userAccessToken') userAccessToken: string,
    @Body('appId') appId: string,
  ): Promise<FacebookUploadResult> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!userAccessToken) {
      throw new BadRequestException('User access token is required');
    }

    if (!appId) {
      throw new BadRequestException('App ID is required');
    }

    return this.facebookService.uploadFileToFacebook(file, userAccessToken, appId);
  }

  @Post('post-photo')
  async postPhoto(
    @Body() postData: {
      pageId: string;
      pageAccessToken: string;
      fileHandle: string;
      caption?: string;
      scheduled_publish_time?: string;
      published?: boolean;
    },
  ) {
    const { pageId, pageAccessToken, fileHandle, ...options } = postData;

    if (!pageId || !pageAccessToken || !fileHandle) {
      throw new BadRequestException('Missing required fields');
    }

    return this.facebookService.postPhotoWithHandle(pageId, pageAccessToken, fileHandle, options);
  }

  @Post('post-video')
  async postVideo(
    @Body() postData: {
      pageId: string;
      pageAccessToken: string;
      fileHandle: string;
      title?: string;
      description?: string;
    },
  ) {
    const { pageId, pageAccessToken, fileHandle, ...options } = postData;

    if (!pageId || !pageAccessToken || !fileHandle) {
      throw new BadRequestException('Missing required fields');
    }

    try {
      // Try posting with file handle first
      return await this.facebookService.postVideoWithHandle(pageId, pageAccessToken, fileHandle, options);
    } catch (error) {
      console.log('File handle method failed, this is expected for videos. File handle method works better for photos.');
      throw error; // Re-throw the error since we don't have the original file here
    }
  }

  @Post('post-video-direct')
  @UseInterceptors(FileInterceptor('file'))
  async postVideoDirect(
    @UploadedFile() file: MulterFile,
    @Body('pageId') pageId: string,
    @Body('pageAccessToken') pageAccessToken: string,
    @Body('title') title?: string,
    @Body('description') description?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!pageId || !pageAccessToken) {
      throw new BadRequestException('Missing required fields');
    }

    const options = { title, description };
    return this.facebookService.postVideoWithDirectUpload(pageId, pageAccessToken, file, options);
  }
}
