import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SocialPagesService } from './social_pages.service';
import { CreateSocialPageDto } from './dto/create-social_page.dto';
import { UpdateSocialPageDto } from './dto/update-social_page.dto';

@Controller('social-pages')
export class SocialPagesController {
  constructor(private readonly socialPagesService: SocialPagesService) {}

  @Post()
  create(@Body() createSocialPageDto: CreateSocialPageDto) {
    return this.socialPagesService.create(createSocialPageDto);
  }

  @Get()
  findAll() {
    return this.socialPagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.socialPagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSocialPageDto: UpdateSocialPageDto) {
    return this.socialPagesService.update(+id, updateSocialPageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.socialPagesService.remove(+id);
  }
}
