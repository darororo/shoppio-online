import { Controller, Post, Get, Param, Query, Body, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
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
}
