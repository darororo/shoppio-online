import { Injectable, BadRequestException } from '@nestjs/common';
import {
  FacebookCommentResponse,
  FacebookCommentsListResponse,
  FacebookPostCommentsResponse,
} from './dto/facebook-comment.dto';
import {
  FacebookConversationResponse,
  FacebookConversationsListResponse,
  FacebookMessageResponse,
  FacebookMessagesListResponse,
} from './dto/facebook-conversation.dto';

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
  async uploadFileToFacebook(
    file: any,
    userAccessToken: string,
    appId: string,
  ): Promise<FacebookUploadResult> {
    console.log('📤 Starting Facebook file upload...', {
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype,
    });

    try {
      // Step 1: Start upload session
      const uploadSessionResponse = (await this.startUploadSession(
        file,
        userAccessToken,
        appId,
      )) as FacebookUploadSessionResponse;
      const uploadSessionId = uploadSessionResponse.id;

      console.log('📤 Upload session started:', uploadSessionId);

      // Step 2: Upload file content
      const uploadResponse = (await this.uploadFileContent(
        file,
        userAccessToken,
        uploadSessionId,
      )) as FacebookUploadResponse;

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
  private async startUploadSession(
    file: any,
    userAccessToken: string,
    appId: string,
  ) {
    console.log('📤 Starting upload session...');

    try {
      const url = `${this.facebookGraphURL}/${appId}/uploads`;
      const params = new URLSearchParams({
        file_name: file.originalname,
        file_length: file.size.toString(),
        file_type: file.mimetype,
        access_token: userAccessToken,
      });

      const response = await fetch(`${url}?${params}`, {
        method: 'POST',
      });

      const result = (await response.json()) as FacebookUploadSessionResponse &
        FacebookErrorResponse;
      console.log('📤 Upload session response:', result);

      if (!response.ok) {
        throw new Error(
          result.error?.message || 'Failed to start upload session',
        );
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
  private async uploadFileContent(
    file: any,
    userAccessToken: string,
    uploadSessionId: string,
  ) {
    console.log('📤 Uploading file content...');

    try {
      const url = `${this.facebookGraphURL}/${uploadSessionId}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `OAuth ${userAccessToken}`,
          file_offset: '0',
        },
        body: file.buffer,
      });

      const result = (await response.json()) as FacebookUploadResponse &
        FacebookErrorResponse;
      console.log('📤 File upload response:', result);

      if (!response.ok) {
        throw new Error(
          result.error?.message || 'Failed to upload file content',
        );
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
    options: any = {},
  ) {
    console.log('📸 Posting photo with handle...', { pageId, fileHandle });

    try {
      const url = `${this.facebookGraphURL}/${pageId}/photos`;

      const formData = new URLSearchParams();
      formData.append('fbuploader_photo_file_chunk', fileHandle);
      formData.append('access_token', pageAccessToken);
      formData.append(
        'published',
        String(options.published !== undefined ? options.published : true),
      );

      // Add optional fields
      if (options.caption) {
        formData.append('caption', options.caption);
      }

      if (options.scheduled_publish_time) {
        formData.append(
          'scheduled_publish_time',
          options.scheduled_publish_time,
        );
        formData.append('published', 'false');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const result = (await response.json()) as FacebookErrorResponse & {
        id?: string;
      };
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
    options: any = {},
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

      const result = (await response.json()) as FacebookErrorResponse & {
        id?: string;
      };
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
    options: any = {},
  ) {
    console.log('🎥 Posting video with direct upload...', {
      pageId,
      fileName: file.originalname,
    });

    try {
      const url = `${this.facebookGraphURL}/${pageId}/videos`;

      const formData = new FormData();
      formData.append(
        'source',
        new Blob([file.buffer], { type: file.mimetype }),
        file.originalname,
      );
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

      const result = (await response.json()) as FacebookErrorResponse & {
        id?: string;
      };
      console.log('🎥 Video direct upload response:', result);

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to post video');
      }

      return result;
    } catch (error) {
      console.error('❌ Video direct upload failed:', error);
      throw new BadRequestException(
        `Video direct upload failed: ${error.message}`,
      );
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
    limit: number = 100,
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

      const result = (await response.json()) as FacebookCommentsListResponse;
      console.log(
        `📥 Successfully fetched ${result.data?.length || 0} comments`,
      );

      return result;
    } catch (error) {
      console.error('❌ Failed to fetch post comments:', error);
      throw new BadRequestException(
        `Failed to fetch post comments: ${error.message}`,
      );
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
    commentLimit: number = 100,
  ): Promise<
    Array<{ postId: string; comments: FacebookCommentsListResponse }>
  > {
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
      const postsWithComments: Array<{
        postId: string;
        comments: FacebookCommentsListResponse;
      }> = [];
      for (const post of posts) {
        try {
          console.log('FETCHING COMMENT of POST');

          const comments = await this.fetchPostComments(
            post.id,
            accessToken,
            'id,message,created_time,from{id,name},parent',
            commentLimit,
          );
          postsWithComments.push({
            postId: post.id,
            comments: comments,
          });
        } catch (error) {
          console.warn(
            `⚠️ Failed to fetch comments for post ${post.id}:`,
            error.message,
          );
          // Continue with other posts even if one fails
          postsWithComments.push({
            postId: post.id,
            comments: { data: [] },
          });
        }
      }

      console.log(
        `📥 Successfully fetched comments for ${postsWithComments.length} posts`,
      );
      return postsWithComments;
    } catch (error) {
      console.error('❌ Failed to fetch page posts with comments:', error);
      throw new BadRequestException(
        `Failed to fetch page posts with comments: ${error.message}`,
      );
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
    fields: string = 'id,message,created_time,from{id,name},parent',
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

      const result = (await response.json()) as FacebookCommentResponse;
      console.log(`📥 Successfully fetched comment ${commentId}`);

      return result;
    } catch (error) {
      console.error('❌ Failed to fetch comment:', error);
      throw new BadRequestException(
        `Failed to fetch comment: ${error.message}`,
      );
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
    fetchAll: boolean = true,
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
          console.log(
            `📥 First request URL: ${url.replace(accessToken, 'HIDDEN_TOKEN')}`,
          );
          isFirstRequest = false;
        } else {
          url = nextUrl!;
          console.log(
            `📥 Pagination request URL: ${url.replace(accessToken, 'HIDDEN_TOKEN')}`,
          );
        }

        console.log(`📥 Making request to Facebook API...`);
        const response = await fetch(url);
        console.log(response);

        console.log(`📥 Facebook API response status: ${response.status}`);

        if (!response.ok) {
          const error = await response.json();
          console.error('❌ Facebook API error response:', error);
          throw new Error(error.error?.message || 'Failed to fetch comments');
        }

        const result = (await response.json()) as FacebookCommentsListResponse;
        console.log(`📥 Facebook API response:`, {
          dataLength: result.data?.length || 0,
          hasNextPage: !!result.paging?.next,
          result: result,
        });

        if (result.data) {
          allComments.push(...result.data);
        }

        nextUrl = result.paging?.next;

        console.log(
          `📥 Fetched ${result.data?.length || 0} comments, total: ${allComments.length}`,
        );
      } while (fetchAll && nextUrl);

      console.log(
        `📥 Finished fetching all comments. Total: ${allComments.length}`,
      );
      return allComments;
    } catch (error) {
      console.error('❌ Failed to fetch all post comments:', error);
      throw new BadRequestException(
        `Failed to fetch all post comments: ${error.message}`,
      );
    }
  }

  /**
   * Fetch all conversations for a Facebook page using Messenger Platform API
   * @param pageId Facebook page ID
   * @param pageAccessToken Page access token with messaging permissions
   * @param platform Platform type ('messenger' or 'instagram')
   * @param limit Number of conversations to fetch per request (default: 100)
   * @returns List of conversations with their IDs and last update time
   */
  async fetchPageConversations(
    pageId: string,
    pageAccessToken: string,
    platform: 'messenger' | 'instagram' = 'messenger',
    limit: number = 100,
  ): Promise<FacebookConversationsListResponse> {
    try {
      console.log(
        `💬 Fetching conversations for page ${pageId} on ${platform}...`,
      );

      const url = `${this.facebookGraphURL}/${pageId}/conversations`;
      const params = new URLSearchParams({
        access_token: pageAccessToken,
        platform: platform,
        limit: limit.toString(),
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Facebook API error response:', error);
        throw new Error(
          error.error?.message || 'Failed to fetch conversations',
        );
      }

      const result =
        (await response.json()) as FacebookConversationsListResponse;
      console.log(
        `💬 Successfully fetched ${result.data?.length || 0} conversations`,
      );

      return result;
    } catch (error) {
      console.error('❌ Failed to fetch page conversations:', error);
      throw new BadRequestException(
        `Failed to fetch page conversations: ${error.message}`,
      );
    }
  }

  /**
   * Fetch all conversations with pagination support
   * @param pageId Facebook page ID
   * @param pageAccessToken Page access token with messaging permissions
   * @param platform Platform type ('messenger' or 'instagram')
   * @param fetchAll Whether to fetch all conversations (following pagination)
   * @returns All conversations for the page
   */
  async fetchAllPageConversations(
    pageId: string,
    pageAccessToken: string,
    platform: 'messenger' | 'instagram' = 'messenger',
    fetchAll: boolean = true,
  ): Promise<FacebookConversationResponse[]> {
    try {
      console.log(
        `💬 Starting to fetch all conversations for page: ${pageId} on ${platform}`,
      );

      const allConversations: FacebookConversationResponse[] = [];
      let nextUrl: string | undefined;
      let isFirstRequest = true;

      do {
        let url: string;

        if (isFirstRequest) {
          url = `${this.facebookGraphURL}/${pageId}/conversations`;
          const params = new URLSearchParams({
            access_token: pageAccessToken,
            platform: platform,
            limit: '100',
          });
          url = `${url}?${params}`;
          console.log(
            `💬 First request URL: ${url.replace(pageAccessToken, 'HIDDEN_TOKEN')}`,
          );
          isFirstRequest = false;
        } else {
          url = nextUrl!;
          console.log(
            `💬 Pagination request URL: ${url.replace(pageAccessToken, 'HIDDEN_TOKEN')}`,
          );
        }

        console.log(`💬 Making request to Facebook API...`);
        const response = await fetch(url);

        console.log(`💬 Facebook API response status: ${response.status}`);

        if (!response.ok) {
          const error = await response.json();
          console.error('❌ Facebook API error response:', error);
          throw new Error(
            error.error?.message || 'Failed to fetch conversations',
          );
        }

        const result =
          (await response.json()) as FacebookConversationsListResponse;
        console.log(`💬 Facebook API response:`, {
          dataLength: result.data?.length || 0,
          hasNextPage: !!result.paging?.next,
        });

        if (result.data) {
          allConversations.push(...result.data);
        }

        nextUrl = result.paging?.next;

        console.log(
          `💬 Fetched ${result.data?.length || 0} conversations, total: ${allConversations.length}`,
        );
      } while (fetchAll && nextUrl);

      console.log(
        `💬 Finished fetching all conversations. Total: ${allConversations.length}`,
      );
      return allConversations;
    } catch (error) {
      console.error('❌ Failed to fetch all page conversations:', error);
      throw new BadRequestException(
        `Failed to fetch all page conversations: ${error.message}`,
      );
    }
  }

  /**
   * Find a specific conversation with a user
   * @param pageId Facebook page ID
   * @param pageAccessToken Page access token with messaging permissions
   * @param userId Instagram-scoped ID or Page-scoped ID for the user
   * @param platform Platform type ('messenger' or 'instagram')
   * @returns Conversation ID if found
   */
  async findConversationWithUser(
    pageId: string,
    pageAccessToken: string,
    userId: string,
    platform: 'messenger' | 'instagram' = 'messenger',
  ): Promise<FacebookConversationResponse | null> {
    try {
      console.log(
        `💬 Finding conversation between page ${pageId} and user ${userId} on ${platform}...`,
      );

      const url = `${this.facebookGraphURL}/${pageId}/conversations`;
      const params = new URLSearchParams({
        access_token: pageAccessToken,
        platform: platform,
        user_id: userId,
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Facebook API error response:', error);
        throw new Error(error.error?.message || 'Failed to find conversation');
      }

      const result =
        (await response.json()) as FacebookConversationsListResponse;

      if (result.data && result.data.length > 0) {
        console.log(`💬 Found conversation: ${result.data[0].id}`);
        return result.data[0];
      } else {
        console.log(
          `💬 No conversation found between page ${pageId} and user ${userId}`,
        );
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to find conversation with user:', error);
      throw new BadRequestException(
        `Failed to find conversation with user: ${error.message}`,
      );
    }
  }

  /**
   * Fetch messages in a conversation
   * @param conversationId Conversation ID
   * @param pageAccessToken Page access token with messaging permissions
   * @param limit Number of messages to fetch (default: 100)
   * @returns List of messages in the conversation
   */
  async fetchConversationMessages(
    conversationId: string,
    pageAccessToken: string,
    limit: number = 100,
  ): Promise<FacebookMessagesListResponse> {
    try {
      console.log(`💬 Fetching messages for conversation ${conversationId}...`);

      const url = `${this.facebookGraphURL}/${conversationId}`;
      const params = new URLSearchParams({
        access_token: pageAccessToken,
        fields: 'messages',
        limit: limit.toString(),
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Facebook API error response:', error);
        throw new Error(
          error.error?.message || 'Failed to fetch conversation messages',
        );
      }

      const result = (await response.json()) as {
        messages: FacebookMessagesListResponse;
        id: string;
      };
      console.log(
        `💬 Successfully fetched ${result.messages?.data?.length || 0} messages`,
      );

      return result.messages;
    } catch (error) {
      console.error('❌ Failed to fetch conversation messages:', error);
      throw new BadRequestException(
        `Failed to fetch conversation messages: ${error.message}`,
      );
    }
  }

  /**
   * Fetch detailed information about a specific message
   * @param messageId Message ID
   * @param pageAccessToken Page access token with messaging permissions
   * @param fields Fields to retrieve for the message
   * @returns Detailed message information
   */
  async fetchMessageDetails(
    messageId: string,
    pageAccessToken: string,
    fields: string = 'id,created_time,from,to,message,attachments{id,mime_type,name,size,image_data,video_data,audio_data,file_url},sticker',
  ): Promise<FacebookMessageResponse> {
    try {
      console.log(`💬 Fetching details for message ${messageId}...`);

      const url = `${this.facebookGraphURL}/${messageId}`;
      const params = new URLSearchParams({
        access_token: pageAccessToken,
        fields: fields,
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Facebook API error response:', error);
        throw new Error(
          error.error?.message || 'Failed to fetch message details',
        );
      }

      const result = (await response.json()) as FacebookMessageResponse;
      
      // Debug sticker data
      if (result.sticker) {
        console.log('🎭 Sticker data received from Facebook API:', {
          messageId: messageId,
          sticker: result.sticker
        });
      }
      
      // Try to fetch user profile picture if this is a user message
      if (result.from?.id && result.from.id !== 'me') {
        try {
          const userProfile = await this.getUserProfile(result.from.id, pageAccessToken, 'profile_pic');
          if (userProfile?.profile_pic) {
            result.from.profile_pic = userProfile.profile_pic;
            console.log(`� Fetched user profile picture for ${result.from.id}`);
          }
        } catch (profileError) {
          console.log(`⚠️ Could not fetch user profile picture for ${result.from.id}:`, profileError.message);
        }
      }

      console.log(`�💬 Successfully fetched message details for ${messageId}`);
      return result;
    } catch (error) {
      console.error('❌ Failed to fetch message details:', error);
      throw new BadRequestException(
        `Failed to fetch message details: ${error.message}`,
      );
    }
  }

  /**
   * Fetch all messages in a conversation with pagination support
   * @param conversationId Conversation ID
   * @param pageAccessToken Page access token with messaging permissions
   * @param fetchAll Whether to fetch all messages (following pagination)
   * @param since ISO timestamp to fetch messages since this time (optional)
   * @returns All messages in the conversation with details
   */
  async fetchAllConversationMessages(
    conversationId: string,
    pageAccessToken: string,
    fetchAll: boolean = true,
    since?: string,
  ): Promise<FacebookMessageResponse[]> {
    try {
      console.log(
        `💬 Starting to fetch all messages for conversation: ${conversationId}`,
      );

      // First get all message IDs
      const allMessageIds: { id: string; created_time: string }[] = [];
      let nextUrl: string | undefined;
      let isFirstRequest = true;

      do {
        let url: string;

        if (isFirstRequest) {
          url = `${this.facebookGraphURL}/${conversationId}`;
          const params = new URLSearchParams({
            access_token: pageAccessToken,
            fields: 'messages',
          });
          url = `${url}?${params}`;
          isFirstRequest = false;
        } else {
          url = nextUrl!;
        }

        const response = await fetch(url);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Failed to fetch messages');
        }

        const result = (await response.json()) as {
          messages: FacebookMessagesListResponse;
          id: string;
        };

        if (result.messages?.data) {
          allMessageIds.push(...result.messages.data);
        }

        nextUrl = result.messages?.paging?.next;

        console.log(
          `💬 Fetched ${result.messages?.data?.length || 0} message IDs, total: ${allMessageIds.length}`,
        );
      } while (fetchAll && nextUrl);

      // Now fetch details for the most recent 20 messages (API limitation)
      const recentMessageIds = allMessageIds.slice(0, 20);
      const messagesWithDetails: FacebookMessageResponse[] = [];

      console.log(
        `💬 Fetching details for ${recentMessageIds.length} most recent messages...`,
      );

      for (const messageInfo of recentMessageIds) {
        try {
          const messageDetails = await this.fetchMessageDetails(
            messageInfo.id,
            pageAccessToken,
          );
          messagesWithDetails.push(messageDetails);
        } catch (error) {
          console.warn(
            `⚠️ Failed to fetch details for message ${messageInfo.id}:`,
            error.message,
          );
          // Add basic message info even if details fetch fails
          messagesWithDetails.push({
            id: messageInfo.id,
            created_time: messageInfo.created_time,
            message:
              'Unable to fetch message details - may be older than 20 most recent messages',
          } as FacebookMessageResponse);
        }
      }

      // Filter messages by 'since' parameter if provided
      let filteredMessages = messagesWithDetails;
      if (since) {
        const sinceDate = new Date(since);
        filteredMessages = messagesWithDetails.filter(msg => {
          const messageDate = new Date(msg.created_time);
          return messageDate > sinceDate;
        });
        
        console.log(
          `🔄 Filtered to ${filteredMessages.length} messages since ${since} (from ${messagesWithDetails.length} total)`,
        );
      }

      console.log(
        `💬 Finished fetching message details. Total messages: ${allMessageIds.length}, with details: ${messagesWithDetails.length}, filtered: ${filteredMessages.length}`,
      );
      return filteredMessages;
    } catch (error) {
      console.error('❌ Failed to fetch all conversation messages:', error);
      throw new BadRequestException(
        `Failed to fetch all conversation messages: ${error.message}`,
      );
    }
  }

  /**
   * Fetch conversation participants to get page-scoped IDs
   * @param conversationId Conversation ID
   * @param pageAccessToken Page access token with messaging permissions
   * @param fields Fields to retrieve for the conversation
   * @returns Conversation details with participants
   */
  async fetchConversationParticipants(
    conversationId: string,
    pageAccessToken: string,
    fields: string = 'id,name,participants',
  ): Promise<any> {
    try {
      console.log(
        `💬 Fetching participants for conversation ${conversationId}...`,
      );

      const url = `${this.facebookGraphURL}/${conversationId}`;
      const params = new URLSearchParams({
        access_token: pageAccessToken,
        fields: fields,
      });

      const response = await fetch(`${url}?${params}`);

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Facebook API error response:', error);
        throw new Error(
          error.error?.message || 'Failed to fetch conversation participants',
        );
      }

      const result = await response.json();
      console.log(
        `💬 Successfully fetched conversation participants for ${conversationId}`,
      );

      return result;
    } catch (error) {
      console.error('❌ Failed to fetch conversation participants:', error);
      throw new BadRequestException(
        `Failed to fetch conversation participants: ${error.message}`,
      );
    }
  }

  /**
   * Get conversations for a Facebook page
   * @param pageId - The Facebook page ID
   * @param pageAccessToken - Page access token
   * @param platform - 'messenger' or 'instagram'
   */
  async getPageConversations(
    pageId: string,
    pageAccessToken: string,
    platform: 'messenger' | 'instagram' = 'messenger'
  ) {
    try {
      console.log(`📋 Fetching conversations for page ${pageId} on ${platform}`);

      const url = `${this.facebookGraphURL}/${pageId}/conversations?platform=${platform}&access_token=${pageAccessToken}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Facebook API error response:', error);
        throw new Error(
          error.error?.message || 'Failed to fetch page conversations',
        );
      }

      const result = await response.json();
      console.log(`✅ Successfully fetched ${result.data?.length || 0} conversations for page ${pageId}`);

      return result;
    } catch (error) {
      console.error('❌ Failed to fetch page conversations:', error);
      throw new BadRequestException(
        `Failed to fetch page conversations: ${error.message}`,
      );
    }
  }

  /**
   * Get messages from a specific conversation
   * @param conversationId - The conversation ID
   * @param pageAccessToken - Page access token
   * @param fields - Fields to retrieve (default: 'messages{id,created_time,from,to,message}')
   */
  async getConversationMessages(
    conversationId: string,
    pageAccessToken: string,
    fields: string = 'messages{id,created_time,from,to,message}'
  ) {
    try {
      console.log(`📨 Fetching messages for conversation ${conversationId}`);

      const url = `${this.facebookGraphURL}/${conversationId}?fields=${encodeURIComponent(fields)}&access_token=${pageAccessToken}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Facebook API error response:', error);
        throw new Error(
          error.error?.message || 'Failed to fetch conversation messages',
        );
      }

      const result = await response.json();
      console.log(`✅ Successfully fetched ${result.messages?.data?.length || 0} messages for conversation ${conversationId}`);

      return result;
    } catch (error) {
      console.error('❌ Failed to fetch conversation messages:', error);
      throw new BadRequestException(
        `Failed to fetch conversation messages: ${error.message}`,
      );
    }
  }

  /**
   * Get user profile information by PSID (Page-Scoped ID)
   * @param psid - Page-scoped ID of the user
   * @param pageAccessToken - Page access token
   * @param fields - Profile fields to retrieve
   */
  async getUserProfile(
    psid: string,
    pageAccessToken: string,
    fields: string = 'first_name,last_name,profile_pic,locale,timezone,gender'
  ) {
    try {
      console.log(`👤 Fetching user profile for PSID ${psid}`);

      const url = `${this.facebookGraphURL}/${psid}?fields=${encodeURIComponent(fields)}&access_token=${pageAccessToken}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Facebook API error response:', error);
        
        // Handle specific error for users without available profiles
        if (error.error?.code === 2018218) {
          console.warn('⚠️ No profile available for this user (phone number account)');
          return {
            first_name: 'Unknown',
            last_name: 'User', 
            profile_pic: null,
            psid: psid
          };
        }
        
        throw new Error(
          error.error?.message || 'Failed to fetch user profile',
        );
      }

      const result = await response.json();
      console.log(`✅ Successfully fetched profile for user: ${result.first_name} ${result.last_name}`);

      return {
        ...result,
        psid: psid // Include the PSID for reference
      };
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      // Return fallback profile instead of throwing error
      return {
        first_name: 'Unknown',
        last_name: 'User',
        profile_pic: null,
        psid: psid,
        error: error.message
      };
    }
  }

  /**
   * Get conversations with user profiles for a Facebook page
   * This combines conversations and user profile data
   * @param pageId - The Facebook page ID
   * @param pageAccessToken - Page access token 
   * @param platform - 'messenger' or 'instagram'
   */
  async getPageConversationsWithProfiles(
    pageId: string,
    pageAccessToken: string,
    platform: 'messenger' | 'instagram' = 'messenger'
  ) {
    try {
      console.log(`🔄 Fetching conversations with profiles for page ${pageId}`);

      // Get all conversations
      const conversationsData = await this.getPageConversations(pageId, pageAccessToken, platform);
      
      if (!conversationsData.data || conversationsData.data.length === 0) {
        return { data: [] };
      }

      // For each conversation, get messages and user profiles
      const enrichedConversations = await Promise.all(
        conversationsData.data.map(async (conversation: any) => {
          try {
            // Get messages for this conversation
            const messagesData = await this.getConversationMessages(
              conversation.id,
              pageAccessToken,
              'messages{id,created_time,from,to,message}'
            );

            // Extract unique user PSIDs from messages
            const userPsids = new Set<string>();
            messagesData.messages?.data?.forEach((message: any) => {
              if (message.from && message.from.id !== pageId) {
                userPsids.add(message.from.id);
              }
            });

            // Get user profiles for all PSIDs
            const userProfiles = await Promise.all(
              Array.from(userPsids).map(async (psid) => {
                return this.getUserProfile(psid, pageAccessToken);
              })
            );

            // Create a profile lookup map
            const profileMap = new Map();
            userProfiles.forEach(profile => {
              profileMap.set(profile.psid, profile);
            });

            return {
              ...conversation,
              messages: messagesData.messages?.data || [],
              userProfiles: userProfiles,
              profileMap: Object.fromEntries(profileMap)
            };
          } catch (error) {
            console.error(`❌ Error processing conversation ${conversation.id}:`, error);
            return {
              ...conversation,
              messages: [],
              userProfiles: [],
              profileMap: {},
              error: error.message
            };
          }
        })
      );

      console.log(`✅ Successfully enriched ${enrichedConversations.length} conversations with profiles`);
      
      return { 
        data: enrichedConversations,
        pageId,
        platform,
        total: enrichedConversations.length
      };
    } catch (error) {
      console.error('❌ Failed to fetch conversations with profiles:', error);
      throw new BadRequestException(
        `Failed to fetch conversations with profiles: ${error.message}`,
      );
    }
  }
}
