import { Controller, Get, Query, Headers, Param } from '@nestjs/common';
import { SocialMessagesService } from './social_messages.service';
import { FacebookService } from 'src/facebook/facebook.service';

@Controller('social-messages')
export class SocialMessagesController {
  constructor(
    private readonly socialMessagesService: SocialMessagesService,
    private readonly facebookService: FacebookService,
  ) {}

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
          error: 'Missing or invalid authorization header'
        };
      }

      const accessToken = authorization.replace('Bearer ', '');

      console.log('🔍 Debug Info:', {
        postId,
        socialPageId,
        internalPostId,
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length
      });

      // Fetch comments from Facebook
      const comments = await this.facebookService.fetchAllPostComments(
        postId,
        accessToken,
        true
      );

      // Save comments to database
      const savedMessages = await this.socialMessagesService.saveFacebookComments(
        comments,
        socialPageId,
        postId,
        internalPostId
      );

      return {
        success: true,
        message: `Successfully fetched and saved ${savedMessages.length} comments`,
        data: {
          totalComments: comments.length,
          savedComments: savedMessages.length,
          postId: postId,
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to fetch comments: ${error.message}`,
        error: error.message
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
          error: 'Missing or invalid authorization header'
        };
      }

      const accessToken = authorization.replace('Bearer ', '');
      const parsedPostLimit = parseInt(postLimit) || 25;
      const parsedCommentLimit = parseInt(commentLimit) || 100;

      // Get the Facebook page ID from our database using the UUID
      const socialPage = await this.socialMessagesService.findSocialPageByUuid(socialPageUuid);
      if (!socialPage) {
        return {
          success: false,
          message: 'Social page not found with the provided UUID',
          error: 'Invalid social page UUID'
        };
      }

      console.log('🔍 Fetching comments for page:', {
        socialPageUuid,
        facebookPageId: socialPage.page_id,
        postLimit: parsedPostLimit,
        commentLimit: parsedCommentLimit
      });

      // Fetch posts with comments from Facebook using the actual Facebook page ID
      const postsWithComments = await this.facebookService.fetchPagePostsWithComments(
        socialPage.page_id,
        accessToken,
        parsedPostLimit,
        parsedCommentLimit
      );

      let totalComments = 0;
      let totalSaved = 0;

      // Process each post's comments
      for (const postData of postsWithComments) {
        const comments = postData.comments.data || [];
        totalComments += comments.length;

        if (comments.length > 0) {
          const savedMessages = await this.socialMessagesService.saveFacebookComments(
            comments,
            socialPageUuid,
            postData.postId
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
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to fetch page comments: ${error.message}`,
        error: error.message
      };
    }
  }



  /**
   * Helper endpoint: Get stored comments for a Facebook post
   */
  @Get('comments/post/:facebookPostId')
  async getStoredCommentsByPost(@Param('facebookPostId') facebookPostId: string) {
    try {
      const comments = await this.socialMessagesService.findCommentsByFacebookPostId(facebookPostId);
      
      return {
        success: true,
        data: {
          postId: facebookPostId,
          totalComments: comments.length,
          comments: comments.map(comment => ({
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
            sentiment: comment.sentiment
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get stored comments: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Helper endpoint: Get all stored comments with pagination
   */
  @Get('comments/all')
  async getAllStoredComments(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    try {
      const pageNumber = parseInt(page) || 1;
      const limitNumber = parseInt(limit) || 10;
      const skip = (pageNumber - 1) * limitNumber;

      const [comments, total] = await this.socialMessagesService.findAllCommentsWithPagination(skip, limitNumber);
      
      return {
        success: true,
        data: {
          comments: comments.map(comment => ({
            id: comment.id,
            facebook_comment_id: comment.facebook_comment_id,
            facebook_post_id: comment.facebook_post_id,
            parent_comment_id: comment.parent_comment_id,
            message_text: comment.message_text,
            sender_id: comment.sender_id,
            received_at: comment.received_at,
            created_at: comment.created_at,
            message_type: comment.message_type
          })),
          pagination: {
            page: pageNumber,
            limit: limitNumber,
            total,
            totalPages: Math.ceil(total / limitNumber)
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get comments: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Helper endpoint: Get comments by social page UUID
   */
  @Get('comments/page/:socialPageId')
  async getCommentsByPage(@Param('socialPageId') socialPageId: string) {
    try {
      const comments = await this.socialMessagesService.findCommentsBySocialPageId(socialPageId);
      
      return {
        success: true,
        data: {
          socialPageId,
          totalComments: comments.length,
          comments: comments.map(comment => ({
            id: comment.id,
            facebook_comment_id: comment.facebook_comment_id,
            facebook_post_id: comment.facebook_post_id,
            message_text: comment.message_text,
            sender_id: comment.sender_id,
            received_at: comment.received_at,
            created_at: comment.created_at
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get comments: ${error.message}`,
        error: error.message
      };
    }
  }
}
