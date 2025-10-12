import { Controller, Post, Get, Param, Query, Body, UploadedFile, UseInterceptors, BadRequestException, Headers } from '@nestjs/common';
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

  // 1. Get a List of Conversations
  // GET /facebook/conversations/:pageId?platform=PLATFORM&access_token=PAGE-ACCESS-TOKEN
  @Get('conversations/:pageId')
  async getConversations(
    @Param('pageId') pageId: string,
    @Query('platform') platform: 'messenger' | 'instagram' = 'messenger',
    @Query('access_token') accessToken: string,
    @Query('limit') limit: string = '100',
  ) {
    if (!pageId || !accessToken) {
      throw new BadRequestException('Page ID and access_token are required');
    }

    const limitNum = parseInt(limit, 10);
    return this.facebookService.fetchPageConversations(pageId, accessToken, platform, limitNum);
  }

  // 2. Find a Conversation with a Specific User
  // GET /facebook/conversations/:pageId/user?platform=PLATFORM&user_id=USER-SCOPED-ID&access_token=PAGE-ACCESS-TOKEN
  @Get('conversations/:pageId/user')
  async findConversationWithUser(
    @Param('pageId') pageId: string,
    @Query('platform') platform: 'messenger' | 'instagram' = 'messenger',
    @Query('user_id') userId: string,
    @Query('access_token') accessToken: string,
  ) {
    if (!pageId || !accessToken || !userId) {
      throw new BadRequestException('Page ID, user_id, and access_token are required');
    }

    return this.facebookService.findConversationWithUser(pageId, accessToken, userId, platform);
  }

  // 3. Get a List of Messages in a Conversation
  // GET /facebook/conversation/:conversationId?fields=messages&access_token=PAGE-ACCESS-TOKEN
  @Get('conversation/:conversationId')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Query('fields') fields: string = 'messages',
    @Query('access_token') accessToken: string,
    @Query('limit') limit: string = '100',
  ) {
    if (!conversationId || !accessToken) {
      throw new BadRequestException('Conversation ID and access_token are required');
    }

    const limitNum = parseInt(limit, 10);
    return this.facebookService.fetchConversationMessages(conversationId, accessToken, limitNum);
  }

  // 4. Get Information about a Message
  // GET /facebook/message/:messageId?fields=id,created_time,from,to,message&access_token=PAGE-ACCESS-TOKEN
  @Get('message/:messageId')
  async getMessageDetails(
    @Param('messageId') messageId: string,
    @Query('fields') fields: string = 'id,created_time,from,to,message',
    @Query('access_token') accessToken: string,
  ) {
    if (!messageId || !accessToken) {
      throw new BadRequestException('Message ID and access_token are required');
    }

    return this.facebookService.fetchMessageDetails(messageId, accessToken, fields);
  }

  // 5. Find Page Scope ID (for conversation participants)
  // GET /facebook/conversation/:conversationId/participants?fields=id,name,participants&access_token=PAGE-ACCESS-TOKEN
  @Get('conversation/:conversationId/participants')
  async getConversationParticipants(
    @Param('conversationId') conversationId: string,
    @Query('fields') fields: string = 'id,name,participants',
    @Query('access_token') accessToken: string,
  ) {
    if (!conversationId || !accessToken) {
      throw new BadRequestException('Conversation ID and access_token are required');
    }

    return this.facebookService.fetchConversationParticipants(conversationId, accessToken, fields);
  }

  /**
   * Get all conversations for a Facebook page
   * GET /facebook/page/:pageId/conversations?platform=messenger&access_token=PAGE_ACCESS_TOKEN
   */
  @Get('page/:pageId/conversations')
  async getPageConversations(
    @Param('pageId') pageId: string,
    @Query('platform') platform: 'messenger' | 'instagram' = 'messenger',
    @Query('access_token') accessToken: string,
  ) {
    if (!pageId || !accessToken) {
      throw new BadRequestException('Page ID and access_token are required');
    }

    return this.facebookService.getPageConversations(pageId, accessToken, platform);
  }



  /**
   * Get user profile by PSID (Page-Scoped ID)
   * GET /facebook/user/:psid/profile?access_token=PAGE_ACCESS_TOKEN
   */
  @Get('user/:psid/profile')
  async getUserProfile(
    @Param('psid') psid: string,
    @Query('fields') fields: string = 'first_name,last_name,profile_pic,locale,timezone,gender',
    @Query('access_token') accessToken: string,
  ) {
    if (!psid || !accessToken) {
      throw new BadRequestException('PSID and access_token are required');
    }

    return this.facebookService.getUserProfile(psid, accessToken, fields);
  }

  /**
   * Get conversations with user profiles for a Facebook page
   * This is the main endpoint that combines conversations and user profile data
   * GET /facebook/page/:pageId/conversations-with-profiles?platform=messenger&access_token=PAGE_ACCESS_TOKEN
   */
  @Get('page/:pageId/conversations-with-profiles')
  async getPageConversationsWithProfiles(
    @Param('pageId') pageId: string,
    @Query('platform') platform: 'messenger' | 'instagram' = 'messenger',
    @Query('access_token') accessToken: string,
  ) {
    if (!pageId || !accessToken) {
      throw new BadRequestException('Page ID and access_token are required');
    }

    return this.facebookService.getPageConversationsWithProfiles(pageId, accessToken, platform);
  }

  /**
   * Get all messages in a conversation with detailed information
   * GET /facebook/conversation/:conversationId/messages?access_token=PAGE_ACCESS_TOKEN&fetch_all=true&since=ISO_TIMESTAMP
   */
  @Get('conversation/:conversationId/messages')
  async getAllConversationMessages(
    @Param('conversationId') conversationId: string,
    @Query('access_token') accessToken: string,
    @Query('fetch_all') fetchAll: string = 'true',
    @Query('since') since?: string,
  ) {
    console.log('Debug - Received parameters:', {
      conversationId,
      accessToken: accessToken ? 'PROVIDED' : 'NOT PROVIDED',
      accessTokenLength: accessToken?.length || 0,
      fetchAll,
      since
    });

    if (!conversationId || !accessToken) {
      throw new BadRequestException('Conversation ID and access_token are required');
    }

    const shouldFetchAll = fetchAll === 'true';
    return this.facebookService.fetchAllConversationMessages(conversationId, accessToken, shouldFetchAll, since);
  }

  // === MESSENGER SEND API ENDPOINTS ===

  /**
   * Send a text message to a user
   * POST /facebook/send/text
   */
  @Post('send/text')
  async sendTextMessage(
    @Body() messageData: {
      recipientId: string;
      text: string;
      pageAccessToken: string;
      quickReplies?: Array<{
        content_type: 'text' | 'user_phone_number' | 'user_email';
        title?: string;
        payload?: string;
        image_url?: string;
      }>;
    },
  ) {
    const { recipientId, text, pageAccessToken, quickReplies } = messageData;

    if (!recipientId || !text || !pageAccessToken) {
      throw new BadRequestException('recipientId, text, and pageAccessToken are required');
    }

    return this.facebookService.sendTextMessage(recipientId, text, pageAccessToken, quickReplies);
  }

  /**
   * Send an attachment (image, audio, video, or file)
   * POST /facebook/send/attachment
   */
  @Post('send/attachment')
  async sendAttachment(
    @Body() attachmentData: {
      recipientId: string;
      attachmentType: 'image' | 'audio' | 'video' | 'file';
      attachmentUrl: string;
      pageAccessToken: string;
      isReusable?: boolean;
    },
  ) {
    const { recipientId, attachmentType, attachmentUrl, pageAccessToken, isReusable = false } = attachmentData;

    if (!recipientId || !attachmentType || !attachmentUrl || !pageAccessToken) {
      throw new BadRequestException('recipientId, attachmentType, attachmentUrl, and pageAccessToken are required');
    }

    return this.facebookService.sendAttachment(recipientId, attachmentType, attachmentUrl, pageAccessToken, isReusable);
  }

  /**
   * Send a generic template with cards
   * POST /facebook/send/template/generic
   */
  @Post('send/template/generic')
  async sendGenericTemplate(
    @Body() templateData: {
      recipientId: string;
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
      }>;
      pageAccessToken: string;
    },
  ) {
    const { recipientId, elements, pageAccessToken } = templateData;

    if (!recipientId || !elements || !pageAccessToken) {
      throw new BadRequestException('recipientId, elements, and pageAccessToken are required');
    }

    return this.facebookService.sendGenericTemplate(recipientId, elements, pageAccessToken);
  }

  /**
   * Send a button template
   * POST /facebook/send/template/button
   */
  @Post('send/template/button')
  async sendButtonTemplate(
    @Body() templateData: {
      recipientId: string;
      text: string;
      buttons: Array<{
        type: 'web_url' | 'postback' | 'phone_number';
        title: string;
        url?: string;
        payload?: string;
      }>;
      pageAccessToken: string;
    },
  ) {
    const { recipientId, text, buttons, pageAccessToken } = templateData;

    if (!recipientId || !text || !buttons || !pageAccessToken) {
      throw new BadRequestException('recipientId, text, buttons, and pageAccessToken are required');
    }

    return this.facebookService.sendButtonTemplate(recipientId, text, buttons, pageAccessToken);
  }

  /**
   * Send typing indicators or mark as seen
   * POST /facebook/send/action
   */
  @Post('send/action')
  async sendSenderAction(
    @Body() actionData: {
      recipientId: string;
      action: 'typing_on' | 'typing_off' | 'mark_seen';
      pageAccessToken: string;
    },
  ) {
    const { recipientId, action, pageAccessToken } = actionData;

    if (!recipientId || !action || !pageAccessToken) {
      throw new BadRequestException('recipientId, action, and pageAccessToken are required');
    }

    return this.facebookService.sendSenderAction(recipientId, action, pageAccessToken);
  }

  /**
   * Send a custom message (full control over message structure)
   * POST /facebook/send/message
   */
  @Post('send/message')
  async sendMessage(
    @Body() messageData: {
      recipientId: string;
      message: any;
      pageAccessToken: string;
      messagingType?: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG' | 'NON_PROMOTIONAL_SUBSCRIPTION';
      tag?: string;
    },
  ) {
    const { 
      recipientId, 
      message, 
      pageAccessToken, 
      messagingType = 'RESPONSE',
      tag 
    } = messageData;

    if (!recipientId || !message || !pageAccessToken) {
      throw new BadRequestException('recipientId, message, and pageAccessToken are required');
    }

    return this.facebookService.sendMessage(recipientId, message, pageAccessToken, messagingType, tag);
  }

  // ======================== SOCIAL MESSAGES ENDPOINTS ========================

  /**
   * Fetch and store comments for a specific Facebook post
   * Access token should be passed in Authorization header as "Bearer <token>"
   */
  @Get('fetch-post-comments/:postId')
  async fetchPostComments(
    @Param('postId') postId: string,
    @Query('socialPageId') socialPageId: string,
    @Query('internalPostId') internalPostId: string,
    @Headers('authorization') authorization: string,
  ) {
    try {
      // Extract access token from Authorization header
      if (!authorization || !authorization.startsWith('Bearer ')) {
        return {
          success: false,
          message: 'Authorization header with Bearer token is required',
          error: 'Missing or invalid authorization header',
        };
      }

      const accessToken = authorization.replace('Bearer ', '');

      console.log('🔍 Debug Info:', {
        postId,
        socialPageId,
        internalPostId,
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length,
      });

      // Fetch comments from Facebook
      const comments = await this.facebookService.fetchAllPostComments(
        postId,
        accessToken,
        true,
      );

      console.log('FACEBOOK COMMENTS');
      console.log(comments);

      // Save comments to database
      const savedMessages =
        await this.facebookService.saveFacebookComments(
          comments,
          socialPageId,
          postId,
          internalPostId,
        );

      return {
        success: true,
        message: `Successfully fetched and saved ${savedMessages.length} comments`,
        data: {
          totalComments: comments.length,
          savedComments: savedMessages.length,
          postId: postId,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to fetch comments: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Fetch and store comments for all posts of a Facebook page
   * Access token should be passed in Authorization header as "Bearer <token>"
   */
  @Get('fetch-page-comments/:socialPageUuid')
  async fetchPageComments(
    @Param('socialPageUuid') socialPageUuid: string,
    @Query('postLimit') postLimit: string = '25',
    @Query('commentLimit') commentLimit: string = '100',
    @Headers('authorization') authorization: string,
  ) {
    try {
      // Extract access token from Authorization header
      if (!authorization || !authorization.startsWith('Bearer ')) {
        return {
          success: false,
          message: 'Authorization header with Bearer token is required',
          error: 'Missing or invalid authorization header',
        };
      }

      const accessToken = authorization.replace('Bearer ', '');
      const parsedPostLimit = parseInt(postLimit) || 25;
      const parsedCommentLimit = parseInt(commentLimit) || 100;

      // Get the Facebook page ID from our database using the UUID
      const socialPage =
        await this.facebookService.findSocialPageByUuid(socialPageUuid);
      if (!socialPage) {
        return {
          success: false,
          message: 'Social page not found with the provided UUID',
          error: 'Invalid social page UUID',
        };
      }

      console.log('🔍 Fetching comments for page:', {
        socialPageUuid,
        facebookPageId: socialPage.page_id,
        postLimit: parsedPostLimit,
        commentLimit: parsedCommentLimit,
      });

      // Fetch posts with comments from Facebook using the actual Facebook page ID
      const postsWithComments =
        await this.facebookService.fetchPagePostsWithComments(
          socialPage.page_id,
          accessToken,
          parsedPostLimit,
          parsedCommentLimit,
        );

      let totalComments = 0;
      let totalSaved = 0;

      // Process each post's comments
      for (const postData of postsWithComments) {
        const comments = postData.comments.data || [];
        totalComments += comments.length;

        if (comments.length > 0) {
          const savedMessages =
            await this.facebookService.saveFacebookComments(
              comments,
              socialPageUuid,
              postData.postId,
            );
          totalSaved += savedMessages.length;
        }
      }

      return {
        success: true,
        message: `Successfully processed ${postsWithComments.length} posts`,
        data: {
          totalPosts: postsWithComments.length,
          totalComments,
          savedComments: totalSaved,
          pageId: socialPage.page_id,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to fetch page comments: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Helper endpoint: Get stored comments for a Facebook post
   */
  @Get('comments/post/:facebookPostId')
  async getStoredCommentsByPost(
    @Param('facebookPostId') facebookPostId: string,
  ) {
    try {
      const comments =
        await this.facebookService.findCommentsByFacebookPostId(
          facebookPostId,
        );

      return {
        success: true,
        data: {
          postId: facebookPostId,
          totalComments: comments.length,
          comments: comments.map((comment) => ({
            id: comment.id,
            facebook_comment_id: comment.facebook_comment_id,
            facebook_post_id: comment.facebook_post_id,
            parent_comment_id: comment.parent_comment_id,
            message_text: comment.message_text,
            sender_id: comment.sender_id,
            received_at: comment.received_at,
            created_at: comment.created_at,
            message_type: comment.message_type,
            analyzed_intent: comment.analyzed_intent,
            sentiment: comment.sentiment,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get stored comments: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Helper endpoint: Get all stored comments with pagination
   */
  @Get('comments/all')
  async getAllStoredComments(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    try {
      const pageNumber = parseInt(page) || 1;
      const limitNumber = parseInt(limit) || 10;
      const skip = (pageNumber - 1) * limitNumber;

      const [comments, total] =
        await this.facebookService.findAllCommentsWithPagination(
          skip,
          limitNumber,
        );

      return {
        success: true,
        data: {
          comments: comments.map((comment) => ({
            id: comment.id,
            facebook_comment_id: comment.facebook_comment_id,
            facebook_post_id: comment.facebook_post_id,
            parent_comment_id: comment.parent_comment_id,
            message_text: comment.message_text,
            sender_id: comment.sender_id,
            sender_name: comment.sender_name,
            received_at: comment.received_at.toLocaleString('en-US', {
              timeZone: 'Asia/Phnom_Penh',
            }),
            created_at: comment.created_at.toLocaleString('en-US', {
              timeZone: 'Asia/Phnom_Penh',
            }),
            message_type: comment.message_type,
          })),
          pagination: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limitNumber),
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get comments: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Helper endpoint: Get comments by social page UUID
   */
  @Get('comments/page/:socialPageId')
  async getCommentsByPage(@Param('socialPageId') socialPageId: string) {
    try {
      const comments =
        await this.facebookService.findCommentsBySocialPageId(
          socialPageId,
        );

      return {
        success: true,
        data: {
          socialPageId,
          totalComments: comments.length,
          comments: comments.map((comment) => ({
            id: comment.id,
            facebook_comment_id: comment.facebook_comment_id,
            facebook_post_id: comment.facebook_post_id,
            message_text: comment.message_text,
            sender_id: comment.sender_id,
            received_at: comment.received_at,
            created_at: comment.created_at,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get comments: ${error.message}`,
        error: error.message,
      };
    }
  }

  @Get('unprocessed')
  async findUnprocessed() {
    return this.facebookService.findUnprocessed();
  }
}
