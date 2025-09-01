import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SocialMessagesService } from './social_messages.service';
import { CreateSocialMessageDto } from './dto/create-social_message.dto';
import { UpdateSocialMessageDto } from './dto/update-social_message.dto';

@Controller('social-messages')
export class SocialMessagesController {
  constructor(private readonly socialMessagesService: SocialMessagesService) {}

  @Post()
  create(@Body() createSocialMessageDto: CreateSocialMessageDto) {
    return this.socialMessagesService.create(createSocialMessageDto);
  }

  @Get()
  findAll() {
    return this.socialMessagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.socialMessagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSocialMessageDto: UpdateSocialMessageDto) {
    return this.socialMessagesService.update(+id, updateSocialMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.socialMessagesService.remove(+id);
  }
}
