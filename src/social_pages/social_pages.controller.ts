import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { SocialPagesService } from './social_pages.service';
import { CreateSocialPageDto } from './dto/create-social_page.dto';
import { UpdateSocialPageDto } from './dto/update-social_page.dto';

@Controller('social-pages')
export class SocialPagesController {
  constructor(private readonly socialPagesService: SocialPagesService) {}

  @Post()
  async create(@Body() createSocialPageDto: CreateSocialPageDto) {
    try {
      const socialPage = await this.socialPagesService.create(createSocialPageDto);
      return {
        success: true,
        data: socialPage,
        message: 'Social page created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create social page: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Connect Facebook pages from Facebook API and store them in database
   * User access token should be passed in Authorization header as "Bearer <token>"
   */
  @Post('connect-facebook')
  async connectFacebookPages(@Headers('authorization') authorization: string) {
    try {
      // Extract access token from Authorization header
      if (!authorization || !authorization.startsWith('Bearer ')) {
        return {
          success: false,
          message: 'Authorization header with Bearer token is required',
          error: 'Missing or invalid authorization header'
        };
      }

      const userAccessToken = authorization.replace('Bearer ', '');

      const socialPages = await this.socialPagesService.connectFacebookPages(userAccessToken);

      return {
        success: true,
        message: `Successfully connected and saved ${socialPages.length} Facebook pages`,
        data: socialPages.map(page => ({
          id: page.id, // This is your socialPageUuid
          page_id: page.page_id,
          page_name: page.page_name,
          created_at: page.created_at
        }))
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect Facebook pages: ${error.message}`,
        error: error.message
      };
    }
  }

  @Get()
  async findAll() {
    try {
      const socialPages = await this.socialPagesService.findAll();
      
      return {
        success: true,
        data: socialPages.map(page => ({
          id: page.id, // This is your socialPageUuid
          page_id: page.page_id, // Facebook page ID
          page_name: page.page_name,
          created_at: page.created_at,
          socialAccount: page.socialAccount ? {
            id: page.socialAccount.id,
            provider: page.socialAccount.provider
          } : null
        }))
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get social pages: ${error.message}`,
        error: error.message
      };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const socialPage = await this.socialPagesService.findOne(id);
      
      if (!socialPage) {
        return {
          success: false,
          message: 'Social page not found',
          error: 'Invalid social page ID'
        };
      }

      return {
        success: true,
        data: {
          id: socialPage.id,
          page_id: socialPage.page_id,
          page_name: socialPage.page_name,
          created_at: socialPage.created_at,
          socialAccount: socialPage.socialAccount ? {
            id: socialPage.socialAccount.id,
            provider: socialPage.socialAccount.provider
          } : null
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to get social page: ${error.message}`,
        error: error.message
      };
    }
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSocialPageDto: UpdateSocialPageDto) {
    try {
      const socialPage = await this.socialPagesService.update(id, updateSocialPageDto);
      
      if (!socialPage) {
        return {
          success: false,
          message: 'Social page not found',
          error: 'Invalid social page ID'
        };
      }

      return {
        success: true,
        data: socialPage,
        message: 'Social page updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to update social page: ${error.message}`,
        error: error.message
      };
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const deleted = await this.socialPagesService.remove(id);
      
      if (!deleted) {
        return {
          success: false,
          message: 'Social page not found',
          error: 'Invalid social page ID'
        };
      }

      return {
        success: true,
        message: 'Social page deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete social page: ${error.message}`,
        error: error.message
      };
    }
  }
}
