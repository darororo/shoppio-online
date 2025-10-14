import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { SocialMessage } from 'src/social_messages/entities/social_message.entity';
import { SocialPage } from 'src/social_pages/entities/social_page.entity';
// import { Post } from 'src/posts/entities/post.entity';
import { CreateSocialMessageFromCommentDto } from 'src/social_messages/dto/create-social-message-from-comment.dto';
import { MessageType } from 'src/social_messages/enum/message_type';
import { FbMessage } from 'src/facebook_message/entities/facebook_message.entity';
import { CreateFacebookMessageDto } from 'src/facebook_message/dto/create_facebook_message.dto';
import { log } from 'console';
import { userInfo } from 'os';

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

export interface FacebookSendMessageResponse {
  recipient_id: string;
  message_id: string;
}

export interface FacebookQuickReply {
  content_type: 'text' | 'user_phone_number' | 'user_email';
  title?: string;
  payload?: string;
  image_url?: string;
}

export interface FacebookButton {
  type: 'web_url' | 'postback' | 'phone_number';
  title: string;
  url?: string;
  payload?: string;
}

export interface FacebookTemplateElement {
  title: string;
  image_url?: string;
  subtitle?: string;
  default_action?: {
    type: 'web_url';
    url: string;
    messenger_extensions?: boolean;
    webview_height_ratio?: 'compact' | 'tall' | 'full';
  };
  buttons?: FacebookButton[];
}

export interface FacebookAttachment {
  type: 'audio' | 'file' | 'image' | 'template' | 'video';
  payload: {
    url?: string;
    is_reusable?: boolean;
    // Template-specific payload
    template_type?: 'generic' | 'button' | 'receipt' | 'media';
    [key: string]: any;
  };
}

export interface FacebookMessage {
  text?: string; // Must be UTF-8 and less than 2000 characters
  attachment?: FacebookAttachment;
  quick_replies?: FacebookQuickReply[];
  metadata?: string; // Must be less than 1000 characters
}

@Injectable()
export class FacebookService {
  private readonly facebookGraphURL = 'https://graph.facebook.com/v23.0';

  constructor(
    @InjectRepository(SocialMessage)
    private socialMessageRepository: Repository<SocialMessage>,
    @InjectRepository(SocialPage)
    private socialPageRepository: Repository<SocialPage>,
    // @InjectRepository(Post)
    // private postRepository: Repository<Post>,
    @InjectRepository(FbMessage)
    private facebookMessageRepository: Repository<FbMessage>,
  ) {}

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
   * Send a message using Facebook Messenger Send API
   * @param recipientId - Page-scoped ID (PSID) of the recipient
   * @param message - Message content following Facebook's message structure
   * @param pageAccessToken - Page access token with pages_messaging permission
   * @param messagingType - Type of message (RESPONSE, UPDATE, MESSAGE_TAG, NON_PROMOTIONAL_SUBSCRIPTION)
   * @param tag - Message tag for certain messaging types (optional)
   * @returns Response from Facebook Send API
   */
  async sendMessage(
    recipientId: string,
    message: FacebookMessage,
    pageAccessToken: string,
    messagingType: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG' | 'NON_PROMOTIONAL_SUBSCRIPTION' = 'RESPONSE',
    tag?: string
  ): Promise<FacebookSendMessageResponse> {
    try {
      console.log(`📤 Sending message to recipient ${recipientId}...`);

      // Validate message structure
      this.validateMessage(message);

      const url = `${this.facebookGraphURL}/me/messages`;
      
      const payload: any = {
        recipient: {
          id: recipientId
        },
        message: message,
        messaging_type: messagingType
      };

      // Add tag if provided (required for MESSAGE_TAG type)
      if (tag) {
        payload.tag = tag;
      }

      console.log('📤 Sending payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pageAccessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Facebook Send API error response:', error);
        throw new Error(
          error.error?.message || 'Failed to send message',
        );
      }

      const result = await response.json() as FacebookSendMessageResponse;
      console.log(`✅ Successfully sent message. Message ID: ${result.message_id}`);

      return result;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw new BadRequestException(
        `Failed to send message: ${error.message}`,
      );
    }
  }

  /**
   * Validate message structure according to Facebook's requirements
   * @param message - The message object to validate
   */
  private validateMessage(message: FacebookMessage): void {
    // Either text or attachment must be set, but not both
    const hasText = message.text && message.text.trim().length > 0;
    const hasAttachment = message.attachment !== null && message.attachment !== undefined;

    if (!hasText && !hasAttachment) {
      throw new Error('Message must contain either text or attachment');
    }

    if (hasText && hasAttachment) {
      throw new Error('Message cannot contain both text and attachment');
    }

    // Validate text constraints
    if (hasText) {
      if (message.text!.length > 2000) {
        throw new Error('Text message must be less than 2000 characters');
      }
      // Check for UTF-8 validity (basic check)
      try {
        encodeURIComponent(message.text!);
      } catch (e) {
        throw new Error('Text must be valid UTF-8');
      }
    }

    // Validate attachment constraints
    if (hasAttachment) {
      const validTypes = ['audio', 'file', 'image', 'template', 'video'];
      if (!validTypes.includes(message.attachment!.type)) {
        throw new Error(`Attachment type must be one of: ${validTypes.join(', ')}`);
      }

      if (!message.attachment!.payload) {
        throw new Error('Attachment must have a payload');
      }
    }

    // Validate metadata constraints
    if (message.metadata && message.metadata.length > 1000) {
      throw new Error('Metadata must be less than 1000 characters');
    }

    // Validate quick replies
    if (message.quick_replies && message.quick_replies.length > 13) {
      throw new Error('Maximum of 13 quick replies allowed');
    }
  }

  /**
   * Send a text message
   * @param recipientId - Page-scoped ID (PSID) of the recipient
   * @param text - Text content of the message
   * @param pageAccessToken - Page access token
   * @param quickReplies - Optional quick replies
   * @returns Response from Facebook Send API
   */
  async sendTextMessage(
    recipientId: string,
    text: string,
    pageAccessToken: string,
    quickReplies?: FacebookQuickReply[]
  ): Promise<FacebookSendMessageResponse> {
    const message: FacebookMessage = {
      text: text
    };

    if (quickReplies && quickReplies.length > 0) {
      message.quick_replies = quickReplies;
    }

    return this.sendMessage(recipientId, message, pageAccessToken);
  }

  /**
   * Send an attachment (image, audio, video, or file)
   * @param recipientId - Page-scoped ID (PSID) of the recipient
   * @param attachmentType - Type of attachment ('image', 'audio', 'video', 'file')
   * @param attachmentUrl - URL or file_id of the attachment
   * @param pageAccessToken - Page access token
   * @param isReusable - Whether the attachment should be reusable (default: false)
   * @returns Response from Facebook Send API
   */
  async sendAttachment(
    recipientId: string,
    attachmentType: 'image' | 'audio' | 'video' | 'file',
    attachmentUrl: string,
    pageAccessToken: string,
    isReusable: boolean = false
  ): Promise<FacebookSendMessageResponse> {
    const message: FacebookMessage = {
      attachment: {
        type: attachmentType as 'image' | 'audio' | 'video' | 'file',
        payload: {
          url: attachmentUrl,
          is_reusable: isReusable
        }
      }
    };

    return this.sendMessage(recipientId, message, pageAccessToken);
  }

  /**
   * Send a template message (generic template, button template, etc.)
   * @param recipientId - Page-scoped ID (PSID) of the recipient
   * @param templateType - Type of template ('generic', 'button', 'receipt', 'media')
   * @param templatePayload - Template-specific payload
   * @param pageAccessToken - Page access token
   * @returns Response from Facebook Send API
   */
  async sendTemplate(
    recipientId: string,
    templateType: 'generic' | 'button' | 'receipt' | 'media',
    templatePayload: any,
    pageAccessToken: string
  ): Promise<FacebookSendMessageResponse> {
    const message: FacebookMessage = {
      attachment: {
        type: 'template' as const,
        payload: {
          template_type: templateType,
          ...templatePayload
        }
      }
    };

    return this.sendMessage(recipientId, message, pageAccessToken);
  }

  /**
   * Send a generic template with cards
   * @param recipientId - Page-scoped ID (PSID) of the recipient
   * @param elements - Array of card elements
   * @param pageAccessToken - Page access token
   * @returns Response from Facebook Send API
   */
  async sendGenericTemplate(
    recipientId: string,
    elements: Array<{
      title: string;
      image_url?: string;
      subtitle?: string;
      default_action?: {
        type: 'web_url';
        url: string;
        messenger_extensions?: boolean;
        webview_height_ratio?: 'compact' | 'tall' | 'full';
      };
      buttons?: Array<{
        type: 'web_url' | 'postback' | 'phone_number';
        title: string;
        url?: string;
        payload?: string;
      }>;
    }>,
    pageAccessToken: string
  ): Promise<FacebookSendMessageResponse> {
    return this.sendTemplate(recipientId, 'generic', { elements }, pageAccessToken);
  }

  /**
   * Send a button template
   * @param recipientId - Page-scoped ID (PSID) of the recipient
   * @param text - Text to display above buttons
   * @param buttons - Array of buttons
   * @param pageAccessToken - Page access token
   * @returns Response from Facebook Send API
   */
  async sendButtonTemplate(
    recipientId: string,
    text: string,
    buttons: Array<{
      type: 'web_url' | 'postback' | 'phone_number';
      title: string;
      url?: string;
      payload?: string;
    }>,
    pageAccessToken: string
  ): Promise<FacebookSendMessageResponse> {
    return this.sendTemplate(recipientId, 'button', { text, buttons }, pageAccessToken);
  }

  /**
   * Send typing indicators
   * @param recipientId - Page-scoped ID (PSID) of the recipient
   * @param action - Sender action ('typing_on', 'typing_off', 'mark_seen')
   * @param pageAccessToken - Page access token
   * @returns Response from Facebook Send API
   */
  async sendSenderAction(
    recipientId: string,
    action: 'typing_on' | 'typing_off' | 'mark_seen',
    pageAccessToken: string
  ): Promise<{ recipient_id: string }> {
    try {
      console.log(`📤 Sending sender action '${action}' to recipient ${recipientId}...`);

      const url = `${this.facebookGraphURL}/me/messages`;
      
      const payload = {
        recipient: {
          id: recipientId
        },
        sender_action: action
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pageAccessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Facebook Send API error response:', error);
        throw new Error(
          error.error?.message || 'Failed to send sender action',
        );
      }

      const result = await response.json();
      console.log(`✅ Successfully sent sender action '${action}'`);

      return result;
    } catch (error) {
      console.error('❌ Failed to send sender action:', error);
      throw new BadRequestException(
        `Failed to send sender action: ${error.message}`,
      );
    }
  }

  /**
   * Fetch and save all conversation messages for a page
   * @param pageId - The Facebook page ID
   * @param pageAccessToken - Page access token
   * @param platform - 'messenger' or 'instagram'
   * @param userId - Optional user ID to associate messages with
   * @param since - Optional ISO timestamp to fetch messages since this time
   * @returns Saved messages grouped by conversation
   */
  async fetchAndSaveAllPageMessages(
    pageId: string,
    pageAccessToken: string,
    platform: 'messenger' | 'instagram' = 'messenger',
    userId?: string,
    since?: string,
  ): Promise<{ [conversationId: string]: FbMessage[] }> {
    try {
      console.log(`🔄 Fetching and saving all messages for page ${pageId}`);

      // Get all conversations
      const conversationsData = await this.getPageConversations(pageId, pageAccessToken, platform);
      
      if (!conversationsData.data || conversationsData.data.length === 0) {
        console.log('📭 No conversations found');
        return {};
      }

      const savedMessagesByConversation: { [conversationId: string]: FbMessage[] } = {};

      // For each conversation, fetch and save messages
      for (const conversation of conversationsData.data) {
        try {
          console.log(`💬 Processing conversation ${conversation.id}`, {
            conversationType: typeof conversation,
            conversationKeys: Object.keys(conversation || {})
          });

          // Fetch all messages for this conversation
          console.log(`🔍 Fetching messages for conversation ${conversation.id} with since: ${since}`);
          const messages = await this.fetchAllConversationMessages(
            conversation.id,
            pageAccessToken,
            true, // fetchAll
            since,
          );

          console.log(`📊 Fetched ${messages.length} messages for conversation ${conversation.id}`);
          
          if (messages.length > 0) {
            console.log(`💾 Sample message from conversation ${conversation.id}:`, {
              messageId: messages[0].id,
              hasMessage: !!messages[0].message,
              messagePreview: messages[0].message?.substring(0, 100),
              from: messages[0].from,
              createdTime: messages[0].created_time,
            });

            // Save messages to database
            const savedMessages = await this.saveFacebookMessages(
              messages,
              conversation.id,
              userId,
            );

            savedMessagesByConversation[conversation.id] = savedMessages;
            console.log(`✅ Saved ${savedMessages.length} messages for conversation ${conversation.id}`);
          } else {
            console.log(`📭 No messages found for conversation ${conversation.id} (possibly due to 'since' filter: ${since})`);
            savedMessagesByConversation[conversation.id] = [];
          }
        } catch (error) {
          console.error(`❌ Error processing conversation ${conversation.id}:`, error);
          // Continue with other conversations
        }
      }

      const totalSaved = Object.values(savedMessagesByConversation).reduce(
        (sum, messages) => sum + messages.length,
        0,
      );

      console.log(`🎉 Successfully processed ${conversationsData.data.length} conversations and saved ${totalSaved} messages`);
      return savedMessagesByConversation;
    } catch (error) {
      console.error('❌ Failed to fetch and save page messages:', error);
      throw new BadRequestException(
        `Failed to fetch and save page messages: ${error.message}`,
      );
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

  async saveFacebookMessages(
    messages: FacebookMessageResponse[],
    conversationId: string,
    userId?: string,
  ): Promise<FbMessage[]> {
    const savedMessages: FbMessage[] = [];
    console.log('🔍 MESSAGES TO SAVE:', {
      totalMessages: messages.length,
      conversationId,
      userId,
      sampleMessage: messages[0] ? {
        id: messages[0].id,
        message: messages[0].message?.substring(0, 50),
        from: messages[0].from,
        created_time: messages[0].created_time,
      } : 'No messages'
    });
    
    if (messages.length === 0) {
      console.log('⚠️ No messages to save');
      return savedMessages;
    }
    
    for (const message of messages) {
      try {
        console.log(`🔍 Processing message: ${message.id}`, {
          hasMessage: !!message.message,
          messageLength: message.message?.length || 0,
          from: message.from,
          to: message.to,
        });

        // Check if message already exists by Facebook message ID
        const existingMessage = await this.facebookMessageRepository.findOne({
          where: { facebookMessageId: message.id },
        });
        
        if (existingMessage) {
          console.log(`⏭️ Message ${message.id} already exists, skipping...`);
          continue;
        }

        // Create the Facebook message entity
        const fbMessage = this.facebookMessageRepository.create({
          facebookMessageId: message.id,
          conversationId: conversationId,
          message: message.message || '',
          from: {
            name: message.from?.name || 'Unknown',
            id: message.from?.id || '',
            profile_pic: message.from?.profile_pic,
          },
          to: message.to || { data: [] },
          // If you have a user relationship, you can set it here
          // user: userId ? { id: userId } : null,
        });

        console.log(`💾 Attempting to save message ${message.id}...`);
        const savedMessage = await this.facebookMessageRepository.save(fbMessage);
        savedMessages.push(savedMessage);

        console.log(`✅ Successfully saved message ${message.id} with internal ID: ${savedMessage.id}`);
      } catch (error) {
        console.error(
          `❌ Failed to save message ${message.id}:`,
          error.message,
          error.stack,
        );
        // Continue with other messages even if one fails
      }
    }

    console.log(`🎉 SAVE SUMMARY: Successfully saved ${savedMessages.length} out of ${messages.length} messages`);
    return savedMessages;
  }

  /**
   * Fetch and save messages for a specific conversation
   * @param conversationId - The conversation ID
   * @param pageAccessToken - Page access token
   * @param userId - Optional user ID to associate messages with
   * @param since - Optional ISO timestamp to fetch messages since this time
   * @returns Saved messages
   */
  async fetchAndSaveConversationMessages(
    conversationId: string,
    pageAccessToken: string,
    userId?: string,
    since?: string,
  ): Promise<FbMessage[]> {
    try {
      console.log(`💬 Fetching and saving messages for conversation ${conversationId}`);

      // Fetch all messages for this conversation
      const messages = await this.fetchAllConversationMessages(
        conversationId,
        pageAccessToken,
        true, // fetchAll
        since,
      );

      if (messages.length === 0) {
        console.log(`📭 No new messages found for conversation ${conversationId}`);
        return [];
      }

      // Save messages to database
      const savedMessages = await this.saveFacebookMessages(
        messages,
        conversationId,
        userId,
      );

      console.log(`✅ Successfully saved ${savedMessages.length} messages for conversation ${conversationId}`);
      return savedMessages;
    } catch (error) {
      console.error(`❌ Failed to fetch and save conversation messages:`, error);
      throw new BadRequestException(
        `Failed to fetch and save conversation messages: ${error.message}`,
      );
    }
  }

  /**
   * Get saved messages from database by conversation ID
   * @param conversationId - The conversation ID
   * @param limit - Maximum number of messages to return
   * @param offset - Number of messages to skip
   * @returns Saved messages from database
   */
  async getSavedMessagesByConversation(
    conversationId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ messages: FbMessage[]; total: number }> {
    try {
      console.log('🔍 Getting saved messages with params:', {
        conversationId,
        limit,
        offset,
      });

      // First, let's check if there are ANY messages in the database
      const totalMessages = await this.facebookMessageRepository.count();
      console.log('📊 Total messages in database:', totalMessages);

      // Check messages for this specific conversation
      const conversationMessages = await this.facebookMessageRepository.count({
        where: { conversationId },
      });
      console.log(`📊 Messages for conversation ${conversationId}:`, conversationMessages);

      // Get a sample of all messages to see what conversation IDs exist
      const sampleMessages = await this.facebookMessageRepository.find({
        take: 5,
        select: ['id', 'conversationId', 'facebookMessageId', 'message'],
      });
      console.log('🔍 Sample messages in database:', sampleMessages);

      const [messages, total] = await this.facebookMessageRepository.findAndCount({
        where: { conversationId },
        order: { create_at: 'DESC' },
        take: limit,
        skip: offset,
        relations: ['user'],
      });

      console.log('🔍 Query result:', {
        foundMessages: messages.length,
        total,
        queryUsed: { conversationId, limit, offset },
      });

      return { messages, total };
    } catch (error) {
      console.error('❌ Failed to get saved messages:', error);
      throw new BadRequestException(
        `Failed to get saved messages: ${error.message}`,
      );
    }
  }

  /**
   * Debug method to get conversation info
   */
  async getDebugConversationInfo() {
    try {
      // Get total count
      const total = await this.facebookMessageRepository.count();
      
      // Get unique conversation IDs
      const conversationIds = await this.facebookMessageRepository
        .createQueryBuilder('message')
        .select('DISTINCT message.conversationId', 'conversationId')
        .addSelect('COUNT(*)', 'messageCount')
        .groupBy('message.conversationId')
        .getRawMany();

      // Get some sample messages
      const samples = await this.facebookMessageRepository.find({
        take: 10,
        select: ['id', 'conversationId', 'facebookMessageId', 'message'],
        order: { create_at: 'DESC' },
      });

      return {
        totalMessages: total,
        uniqueConversations: conversationIds.length,
        conversationIds: conversationIds,
        sampleMessages: samples,
      };
    } catch (error) {
      console.error('❌ Failed to get debug info:', error);
      throw new BadRequestException(`Failed to get debug info: ${error.message}`);
    }
  }
 

  // ======================== SOCIAL MESSAGES (COMMENTS) METHODS ========================

  /**
   * Create a social message from Facebook comment data
   */
  async createFromFacebookComment(
    dto: CreateSocialMessageFromCommentDto,
  ): Promise<SocialMessage> {
    // Find the social page
    const socialPage = await this.socialPageRepository.findOne({
      where: { id: dto.social_page_id },
    });

    if (!socialPage) {
      throw new Error(`Social page with ID ${dto.social_page_id} not found`);
    }

    // Find the post if post_id is provided
    // let post: Post | null = null;
    // if (dto.post_id) {
    //   post = await this.postRepository.findOne({
    //     where: { id: dto.post_id },
    //   });
    // }

    // Create the social message
    const socialMessage = this.socialMessageRepository.create({
      socialPage,
      // post: post || undefined,
      sender_id: dto.sender_id,
      sender_name: dto.sender_name,
      facebook_comment_id: dto.facebook_comment_id,
      facebook_post_id: dto.facebook_post_id,
      parent_comment_id: dto.parent_comment_id,
      message_text: dto.message_text,
      message_type: MessageType.COMMENT,
      received_at: new Date(),
    });

    return await this.socialMessageRepository.save(socialMessage);
  }

  /**
   * Bulk save Facebook comments as social messages
   */
  async saveFacebookComments(
    comments: FacebookCommentResponse[],
    socialPageId: string,
    facebookPostId: string,
    postId?: string,
  ): Promise<SocialMessage[]> {
    const savedMessages: SocialMessage[] = [];

    console.log('COMMENTS TO SAVE');
    console.log(comments);

    for (const comment of comments) {
      try {
        // Check if comment already exists
        const existingMessage = await this.socialMessageRepository.findOne({
          where: { facebook_comment_id: comment.id },
        });

        if (existingMessage) {
          console.log(`Comment ${comment.id} already exists, skipping...`);
          continue;
        }

        const dto: CreateSocialMessageFromCommentDto = {
          facebook_comment_id: comment.id,
          facebook_post_id: facebookPostId,
          message_text: comment.message || '',
          sender_id: comment.from?.id || '',
          sender_name: comment.from?.name || '',
          parent_comment_id: comment.parent?.id,
          social_page_id: socialPageId,
          post_id: postId,
        };

        const savedMessage = await this.createFromFacebookComment(dto);
        savedMessages.push(savedMessage);

        console.log(`💾 Saved comment ${comment.id} to database`);
      } catch (error) {
        console.error(
          `❌ Failed to save comment ${comment.id}:`,
          error.message,
        );
        // Continue with other comments even if one fails
      }
    }

    return savedMessages;
  }

  /**
   * Find comments by Facebook post ID
   */
  async findCommentsByFacebookPostId(
    facebookPostId: string,
  ): Promise<SocialMessage[]> {
    return await this.socialMessageRepository.find({
      where: {
        facebook_post_id: facebookPostId,
        message_type: MessageType.COMMENT,
      },
      relations: ['socialPage', 'post', 'buyer'],
      order: { received_at: 'DESC' },
    });
  }

  /**
   * Find comments by social page
   */
  async findCommentsBySocialPage(
    socialPageId: string,
  ): Promise<SocialMessage[]> {
    return await this.socialMessageRepository.find({
      where: {
        socialPage: { id: socialPageId },
        message_type: MessageType.COMMENT,
      },
      relations: ['socialPage', 'post', 'buyer'],
      order: { received_at: 'DESC' },
    });
  }

  /**
   * Find comment by Facebook comment ID
   */
  async findByFacebookCommentId(
    facebookCommentId: string,
  ): Promise<SocialMessage | null> {
    return await this.socialMessageRepository.findOne({
      where: { facebook_comment_id: facebookCommentId },
      relations: ['socialPage', 'post', 'buyer'],
    });
  }

  /**
   * Helper method: Create a social page for testing
   */
  async createSocialPage(data: {
    page_id: string;
    page_name: string;
    access_token?: string;
  }): Promise<SocialPage> {
    const socialPage = this.socialPageRepository.create({
      page_id: data.page_id,
      page_name: data.page_name,
      access_token: data.access_token,
    });

    return await this.socialPageRepository.save(socialPage);
  }

  /**
   * Find a social page by its UUID
   */
  async findSocialPageByUuid(uuid: string): Promise<SocialPage | null> {
    return await this.socialPageRepository.findOne({
      where: { id: uuid },
    });
  }

  /**
   * Find all comments with pagination
   */
  async findAllCommentsWithPagination(
    skip: number,
    limit: number,
  ): Promise<[SocialMessage[], number]> {
    return await this.socialMessageRepository.findAndCount({
      skip,
      take: limit,
      relations: ['socialPage', 'post', 'buyer'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Find comments by social page ID
   */
  async findCommentsBySocialPageId(
    socialPageId: string,
  ): Promise<SocialMessage[]> {
    return await this.socialMessageRepository.find({
      where: { socialPage: { id: socialPageId } },
      relations: ['socialPage', 'post', 'buyer'],
      order: { created_at: 'DESC' },
    });
  }

  async markAsProcessed(id: string) {
    await this.socialMessageRepository.update(id, { is_processed: true });
  }

  async findUnprocessed() {
    const messages = await this.socialMessageRepository.find({
      where: { is_processed: false },
      relations: ['buyer'],
      order: { created_at: 'ASC' }, // optional: keep chronological order
    });

    const grouped = Object.values(
      messages.reduce(
        (acc, msg) => {
          const postId = String(msg.facebook_post_id || 'unknown_post');

          if (!acc[postId]) {
            acc[postId] = {
              post_id: postId,
              messages: [],
            };
          }

          acc[postId].messages.push({
            id: msg.id,
            buyer_id: String(msg.buyer?.id || '0'),
            buyer: msg.buyer?.name || 'Unknown Buyer',
            message_text: msg.message_text,
          });

          return acc;
        },
        {} as Record<
          string,
          {
            post_id: string;
            messages: {
              id: string;
              buyer_id: string;
              buyer: string;
              message_text: string;
            }[];
          }
        >,
      ),
    );

    return grouped;
  }
}
