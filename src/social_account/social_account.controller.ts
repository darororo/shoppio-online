import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SocialAccountService } from './social_account.service';
import { CreateSocialAccountDto } from './dto/create-social_account.dto';
import { UpdateSocialAccountDto } from './dto/update-social_account.dto';

@Controller('social-account')
export class SocialAccountController {
  constructor(private readonly socialAccountService: SocialAccountService) {}

  @Post()
  create(@Body() createSocialAccountDto: CreateSocialAccountDto) {
    return this.socialAccountService.create(createSocialAccountDto);
  }

  @Get()
  findAll() {
    return this.socialAccountService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.socialAccountService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSocialAccountDto: UpdateSocialAccountDto) {
    return this.socialAccountService.update(+id, updateSocialAccountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.socialAccountService.remove(+id);
  }
}
