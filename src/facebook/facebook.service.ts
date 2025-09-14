import { Injectable, BadRequestException } from '@nestjs/common';
import { FacebookCommentResponse, FacebookCommentsListResponse, FacebookPostCommentsResponse } from './dto/facebook-comment.dto';

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

  /**
   * Fetch comments for a specific Facebook post
   * @param postId Facebook post ID
   * @param accessToken Facebook access token
   * @param fields Fields to retrieve for comments
   * @param limit Number of comments to fetch per request
   * @returns Comments data from Facebook
   */
  async fetchPostComments(
    postId: string, 
    accessToken: string, 
    fields: string = 'id,message,created_time,from{id,name},parent',
    limit: number = 100
  ): Promise<FacebookCommentsListResponse> {
    try {
      console.log(`📥 Fetching comments for post ${postId}...`);
      
      const url = `${this.facebookGraphURL}/${postId}/comments`;
      const params = new URLSearchParams({
        access_token: accessToken,
        fields: fields,
        limit: limit.toString(),
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch comments');
      }

      const result = await response.json() as FacebookCommentsListResponse;
      console.log(`📥 Successfully fetched ${result.data?.length || 0} comments`);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch post comments:', error);
      throw new BadRequestException(`Failed to fetch post comments: ${error.message}`);
    }
  }

  /**
   * Fetch all comments for a Facebook page's posts
   * @param pageId Facebook page ID
   * @param accessToken Facebook access token
   * @param postLimit Number of posts to fetch
   * @param commentLimit Number of comments per post
   * @returns Array of posts with their comments
   */
  async fetchPagePostsWithComments(
    pageId: string,
    accessToken: string,
    postLimit: number = 25,
    commentLimit: number = 100
  ): Promise<Array<{ postId: string, comments: FacebookCommentsListResponse }>> {
    try {
      console.log(`📥 Fetching posts with comments for page ${pageId}...`);
      
      // First, get the page's posts
      const postsUrl = `${this.facebookGraphURL}/${pageId}/posts`;
      const postsParams = new URLSearchParams({
        access_token: accessToken,
        fields: 'id',
        limit: postLimit.toString(),
      });

      const postsResponse = await fetch(`${postsUrl}?${postsParams}`);
      
      if (!postsResponse.ok) {
        const error = await postsResponse.json();
        throw new Error(error.error?.message || 'Failed to fetch posts');
      }

      const postsResult = await postsResponse.json();
      const posts = postsResult.data || [];

      console.log(`📥 Found ${posts.length} posts, fetching comments...`);

      // Fetch comments for each post
      const postsWithComments: Array<{ postId: string, comments: FacebookCommentsListResponse }> = [];
      for (const post of posts) {
        try {
          const comments = await this.fetchPostComments(post.id, accessToken, undefined, commentLimit);
          postsWithComments.push({
            postId: post.id,
            comments: comments
          });
        } catch (error) {
          console.warn(`⚠️ Failed to fetch comments for post ${post.id}:`, error.message);
          // Continue with other posts even if one fails
          postsWithComments.push({
            postId: post.id,
            comments: { data: [] }
          });
        }
      }

      console.log(`📥 Successfully fetched comments for ${postsWithComments.length} posts`);
      return postsWithComments;
    } catch (error) {
      console.error('❌ Failed to fetch page posts with comments:', error);
      throw new BadRequestException(`Failed to fetch page posts with comments: ${error.message}`);
    }
  }

  /**
   * Fetch a specific comment by ID
   * @param commentId Facebook comment ID
   * @param accessToken Facebook access token
   * @param fields Fields to retrieve for the comment
   * @returns Comment data from Facebook
   */
  async fetchCommentById(
    commentId: string,
    accessToken: string,
    fields: string = 'id,message,created_time,from{id,name},parent'
  ): Promise<FacebookCommentResponse> {
    try {
      console.log(`📥 Fetching comment ${commentId}...`);
      
      const url = `${this.facebookGraphURL}/${commentId}`;
      const params = new URLSearchParams({
        access_token: accessToken,
        fields: fields,
      });

      const response = await fetch(`${url}?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to fetch comment');
      }

      const result = await response.json() as FacebookCommentResponse;
      console.log(`📥 Successfully fetched comment ${commentId}`);
      
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch comment:', error);
      throw new BadRequestException(`Failed to fetch comment: ${error.message}`);
    }
  }

  /**
   * Fetch all comments with pagination support
   * @param postId Facebook post ID
   * @param accessToken Facebook access token
   * @param fetchAll Whether to fetch all comments (following pagination)
   * @returns All comments for the post
   */
  async fetchAllPostComments(
    postId: string,
    accessToken: string,
    fetchAll: boolean = true
  ): Promise<FacebookCommentResponse[]> {
    try {
      console.log(`📥 Starting to fetch comments for post: ${postId}`);
      console.log(`📥 Access token provided: ${accessToken ? 'Yes' : 'No'}`);
      console.log(`📥 Access token length: ${accessToken?.length || 0}`);
      
      const allComments: FacebookCommentResponse[] = [];
      let nextUrl: string | undefined;
      let isFirstRequest = true;

      do {
        let url: string;
        
        if (isFirstRequest) {
          url = `${this.facebookGraphURL}/${postId}/comments`;
          const params = new URLSearchParams({
            access_token: accessToken,
            fields: 'id,message,created_time,from{id,name},parent',
            limit: '100',
          });
          url = `${url}?${params}`;
          console.log(`📥 First request URL: ${url.replace(accessToken, 'HIDDEN_TOKEN')}`);
          isFirstRequest = false;
        } else {
          url = nextUrl!;
          console.log(`📥 Pagination request URL: ${url.replace(accessToken, 'HIDDEN_TOKEN')}`);
        }

        console.log(`📥 Making request to Facebook API...`);
        const response = await fetch(url);
        
        console.log(`📥 Facebook API response status: ${response.status}`);
        
        if (!response.ok) {
          const error = await response.json();
          console.error('❌ Facebook API error response:', error);
          throw new Error(error.error?.message || 'Failed to fetch comments');
        }

        const result = await response.json() as FacebookCommentsListResponse;
        console.log(`📥 Facebook API response:`, {
          dataLength: result.data?.length || 0,
          hasNextPage: !!result.paging?.next,
          result: result
        });
        
        if (result.data) {
          allComments.push(...result.data);
        }

        nextUrl = result.paging?.next;
        
        console.log(`📥 Fetched ${result.data?.length || 0} comments, total: ${allComments.length}`);
        
      } while (fetchAll && nextUrl);

      console.log(`📥 Finished fetching all comments. Total: ${allComments.length}`);
      return allComments;
    } catch (error) {
      console.error('❌ Failed to fetch all post comments:', error);
      throw new BadRequestException(`Failed to fetch all post comments: ${error.message}`);
    }
  }
}
