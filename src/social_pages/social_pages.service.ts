import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialPage } from './entities/social_page.entity';
import { CreateSocialPageDto } from './dto/create-social_page.dto';
import { UpdateSocialPageDto } from './dto/update-social_page.dto';

@Injectable()
export class SocialPagesService {
  constructor(
    @InjectRepository(SocialPage)
    private socialPageRepository: Repository<SocialPage>,
  ) {}

  async create(createSocialPageDto: CreateSocialPageDto): Promise<SocialPage> {
    // Check if page already exists
    const existingPage = await this.socialPageRepository.findOne({
      where: { page_id: createSocialPageDto.page_id }
    });

    if (existingPage) {
      // Update existing page
      existingPage.page_name = createSocialPageDto.page_name || existingPage.page_name;
      existingPage.access_token = createSocialPageDto.access_token || existingPage.access_token;
      return await this.socialPageRepository.save(existingPage);
    }

    // Create new page
    const socialPage = this.socialPageRepository.create({
      page_id: createSocialPageDto.page_id,
      page_name: createSocialPageDto.page_name,
      access_token: createSocialPageDto.access_token,
    });

    return await this.socialPageRepository.save(socialPage);
  }

  async findAll(): Promise<SocialPage[]> {
    return await this.socialPageRepository.find({
      relations: ['socialAccount'],
      order: { created_at: 'DESC' }
    });
  }

  async findOne(id: string): Promise<SocialPage | null> {
    return await this.socialPageRepository.findOne({
      where: { id },
      relations: ['socialAccount']
    });
  }

  async update(id: string, updateSocialPageDto: UpdateSocialPageDto): Promise<SocialPage | null> {
    const socialPage = await this.socialPageRepository.findOne({ where: { id } });
    
    if (!socialPage) {
      return null;
    }

    Object.assign(socialPage, updateSocialPageDto);
    return await this.socialPageRepository.save(socialPage);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.socialPageRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Connect Facebook pages from Facebook API and store them in database
   */
  async connectFacebookPages(userAccessToken: string): Promise<SocialPage[]> {
    try {
      // Fetch pages from Facebook API
      const response = await fetch(`https://graph.facebook.com/me/accounts?access_token=${userAccessToken}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch Facebook pages');
      }

      const data = await response.json();
      const facebookPages = data.data || [];

      const savedPages: SocialPage[] = [];

      // Save each page to database
      for (const fbPage of facebookPages) {
        const createDto: CreateSocialPageDto = {
          page_id: fbPage.id,
          page_name: fbPage.name,
          access_token: fbPage.access_token,
        };

        const savedPage = await this.create(createDto);
        savedPages.push(savedPage);
      }

      return savedPages;
    } catch (error) {
      throw new Error(`Failed to connect Facebook pages: ${error.message}`);
    }
  }
}
