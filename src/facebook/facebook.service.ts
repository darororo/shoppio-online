import { Injectable, BadRequestException } from '@nestjs/common';

export interface FacebookUploadSessionResponse {
  id: string;
}

export interface FacebookUploadResponse {
  h: string;
}

export interface FacebookErrorResponse {
  error?: {
    message: string;
  };
}

export interface FacebookUploadResult {
  success: boolean;
  handle: string;
  uploadResponse: FacebookUploadResponse;
}

@Injectable()
export class FacebookService {
  private readonly facebookGraphURL = 'https://graph.facebook.com/v23.0';

  /**
   * Upload file to Facebook using Resumable Upload API
   * Step 1: Start upload session
   * Step 2: Upload file content
   */
  async uploadFileToFacebook(file: any, userAccessToken: string, appId: string): Promise<FacebookUploadResult> {
    console.log('📤 Starting Facebook file upload...', { 
      fileName: file.originalname, 
      fileSize: file.size, 
      fileType: file.mimetype 
    });
    
    try {
      // Step 1: Start upload session
      const uploadSessionResponse = await this.startUploadSession(file, userAccessToken, appId) as FacebookUploadSessionResponse;
      const uploadSessionId = uploadSessionResponse.id;
      
      console.log('📤 Upload session started:', uploadSessionId);
      
      // Step 2: Upload file content
      const uploadResponse = await this.uploadFileContent(file, userAccessToken, uploadSessionId) as FacebookUploadResponse;
      
      console.log('📤 File uploaded successfully:', uploadResponse);
      console.log('📤 File handle:', uploadResponse.h);
      
      if (!uploadResponse.h) {
        throw new Error('No file handle received from Facebook upload');
      }
      
      return { success: true, handle: uploadResponse.h, uploadResponse };
      
    } catch (error) {
      console.error('❌ Facebook file upload failed:', error);
      throw new BadRequestException(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Step 1: Start an upload session
   */
  private async startUploadSession(file: any, userAccessToken: string, appId: string) {
    console.log('📤 Starting upload session...');
    
    try {
      const url = `${this.facebookGraphURL}/${appId}/uploads`;
      const params = new URLSearchParams({
        file_name: file.originalname,
        file_length: file.size.toString(),
        file_type: file.mimetype,
        access_token: userAccessToken
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'POST',
      });

      const result = await response.json() as FacebookUploadSessionResponse & FacebookErrorResponse;
      console.log('📤 Upload session response:', result);

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to start upload session');
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to start upload session:', error);
      throw error;
    }
  }

  /**
   * Step 2: Upload file content
   */
  private async uploadFileContent(file: any, userAccessToken: string, uploadSessionId: string) {
    console.log('📤 Uploading file content...');
    
    try {
      const url = `${this.facebookGraphURL}/${uploadSessionId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `OAuth ${userAccessToken}`,
          'file_offset': '0',
        },
        body: file.buffer
      });

      const result = await response.json() as FacebookUploadResponse & FacebookErrorResponse;
      console.log('📤 File upload response:', result);

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to upload file content');
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to upload file content:', error);
      throw error;
    }
  }

  /**
   * Post photo using file handle
   */
  async postPhotoWithHandle(
    pageId: string, 
    pageAccessToken: string, 
    fileHandle: string, 
    options: any = {}
  ) {
    console.log('📸 Posting photo with handle...', { pageId, fileHandle });
    
    try {
      const url = `${this.facebookGraphURL}/${pageId}/photos`;
      
      const formData = new URLSearchParams();
      formData.append('fbuploader_photo_file_chunk', fileHandle);
      formData.append('access_token', pageAccessToken);
      formData.append('published', String(options.published !== undefined ? options.published : true));

      // Add optional fields
      if (options.caption) {
        formData.append('caption', options.caption);
      }
      
      if (options.scheduled_publish_time) {
        formData.append('scheduled_publish_time', options.scheduled_publish_time);
        formData.append('published', 'false');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const result = await response.json() as FacebookErrorResponse & { id?: string };
      console.log('📸 Photo post response:', result);

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to post photo');
      }

      return result;
    } catch (error) {
      console.error('❌ Photo post failed:', error);
      throw new BadRequestException(`Photo post failed: ${error.message}`);
    }
  }

  /**
   * Post video using file handle (method 1)
   */
  async postVideoWithHandle(
    pageId: string, 
    pageAccessToken: string, 
    fileHandle: string, 
    options: any = {}
  ) {
    console.log('🎥 Posting video with handle...', { pageId, fileHandle });
    
    try {
      // Use the standard Graph API endpoint for videos with file handle
      const url = `${this.facebookGraphURL}/${pageId}/videos`;
      
      const formData = new URLSearchParams();
      formData.append('file_handle', fileHandle);
      formData.append('access_token', pageAccessToken);

      // Add optional fields
      if (options.title) {
        formData.append('title', options.title);
      }
      
      if (options.description) {
        formData.append('description', options.description);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const result = await response.json() as FacebookErrorResponse & { id?: string };
      console.log('🎥 Video post response:', result);

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to post video');
      }

      return result;
    } catch (error) {
      console.error('❌ Video post failed:', error);
      throw new BadRequestException(`Video post failed: ${error.message}`);
    }
  }

  /**
   * Post video using direct file upload (method 2 - fallback)
   */
  async postVideoWithDirectUpload(
    pageId: string, 
    pageAccessToken: string, 
    file: any, 
    options: any = {}
  ) {
    console.log('🎥 Posting video with direct upload...', { pageId, fileName: file.originalname });
    
    try {
      const url = `${this.facebookGraphURL}/${pageId}/videos`;
      
      const formData = new FormData();
      formData.append('source', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
      formData.append('access_token', pageAccessToken);

      // Add optional fields
      if (options.title) {
        formData.append('title', options.title);
      }
      
      if (options.description) {
        formData.append('description', options.description);
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json() as FacebookErrorResponse & { id?: string };
      console.log('🎥 Video direct upload response:', result);

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to post video');
      }

      return result;
    } catch (error) {
      console.error('❌ Video direct upload failed:', error);
      throw new BadRequestException(`Video direct upload failed: ${error.message}`);
    }
  }
}
