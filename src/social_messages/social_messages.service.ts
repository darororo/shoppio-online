import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialMessage } from './entities/social_message.entity';
import { SocialPage } from 'src/social_pages/entities/social_page.entity';
import { Post } from 'src/posts/entities/post.entity';
import { CreateSocialMessageDto } from './dto/create-social_message.dto';
import { UpdateSocialMessageDto } from './dto/update-social_message.dto';
import { CreateSocialMessageFromCommentDto } from './dto/create-social-message-from-comment.dto';
import { MessageType } from './enum/message_type';
import { FacebookCommentResponse } from 'src/facebook/dto/facebook-comment.dto';

@Injectable()
export class SocialMessagesService {
  constructor(
    @InjectRepository(SocialMessage)
    private socialMessageRepository: Repository<SocialMessage>,
    @InjectRepository(SocialPage)
    private socialPageRepository: Repository<SocialPage>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  create(createSocialMessageDto: CreateSocialMessageDto) {
    return 'This action adds a new socialMessage';
  }

  findAll() {
    return `This action returns all socialMessages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} socialMessage`;
  }

  update(id: number, updateSocialMessageDto: UpdateSocialMessageDto) {
    return `This action updates a #${id} socialMessage`;
  }

  remove(id: number) {
    return `This action removes a #${id} socialMessage`;
  }

  /**
   * Create a social message from Facebook comment data
   */
  async createFromFacebookComment(dto: CreateSocialMessageFromCommentDto): Promise<SocialMessage> {
    // Find the social page
    const socialPage = await this.socialPageRepository.findOne({
      where: { id: dto.social_page_id }
    });

    if (!socialPage) {
      throw new Error(`Social page with ID ${dto.social_page_id} not found`);
    }

    // Find the post if post_id is provided
    let post: Post | null = null;
    if (dto.post_id) {
      post = await this.postRepository.findOne({
        where: { id: dto.post_id }
      });
    }

    // Create the social message
    const socialMessage = this.socialMessageRepository.create({
      socialPage,
      post: post || undefined,
      sender_id: dto.sender_id,
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
    postId?: string
  ): Promise<SocialMessage[]> {
    const savedMessages: SocialMessage[] = [];

    for (const comment of comments) {
      try {
        // Check if comment already exists
        const existingMessage = await this.socialMessageRepository.findOne({
          where: { facebook_comment_id: comment.id }
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
          parent_comment_id: comment.parent?.id,
          social_page_id: socialPageId,
          post_id: postId,
        };

        const savedMessage = await this.createFromFacebookComment(dto);
        savedMessages.push(savedMessage);
        
        console.log(`💾 Saved comment ${comment.id} to database`);
      } catch (error) {
        console.error(`❌ Failed to save comment ${comment.id}:`, error.message);
        // Continue with other comments even if one fails
      }
    }

    return savedMessages;
  }

  /**
   * Find comments by Facebook post ID
   */
  async findCommentsByFacebookPostId(facebookPostId: string): Promise<SocialMessage[]> {
    return await this.socialMessageRepository.find({
      where: { 
        facebook_post_id: facebookPostId,
        message_type: MessageType.COMMENT 
      },
      relations: ['socialPage', 'post', 'buyer'],
      order: { received_at: 'DESC' }
    });
  }

  /**
   * Find comments by social page
   */
  async findCommentsBySocialPage(socialPageId: string): Promise<SocialMessage[]> {
    return await this.socialMessageRepository.find({
      where: { 
        socialPage: { id: socialPageId },
        message_type: MessageType.COMMENT 
      },
      relations: ['socialPage', 'post', 'buyer'],
      order: { received_at: 'DESC' }
    });
  }

  /**
   * Find comment by Facebook comment ID
   */
  async findByFacebookCommentId(facebookCommentId: string): Promise<SocialMessage | null> {
    return await this.socialMessageRepository.findOne({
      where: { facebook_comment_id: facebookCommentId },
      relations: ['socialPage', 'post', 'buyer']
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
      where: { id: uuid }
    });
  }

  /**
   * Find all comments with pagination
   */
  async findAllCommentsWithPagination(skip: number, limit: number): Promise<[SocialMessage[], number]> {
    return await this.socialMessageRepository.findAndCount({
      skip,
      take: limit,
      relations: ['socialPage', 'post', 'buyer'],
      order: { created_at: 'DESC' }
    });
  }

  /**
   * Find comments by social page ID
   */
  async findCommentsBySocialPageId(socialPageId: string): Promise<SocialMessage[]> {
    return await this.socialMessageRepository.find({
      where: { socialPage: { id: socialPageId } },
      relations: ['socialPage', 'post', 'buyer'],
      order: { created_at: 'DESC' }
    });
  }
}
