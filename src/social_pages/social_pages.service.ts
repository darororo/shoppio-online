import { Injectable } from '@nestjs/common';
import { CreateSocialPageDto } from './dto/create-social_page.dto';
import { UpdateSocialPageDto } from './dto/update-social_page.dto';

@Injectable()
export class SocialPagesService {
  create(createSocialPageDto: CreateSocialPageDto) {
    return 'This action adds a new socialPage';
  }

  findAll() {
    return `This action returns all socialPages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} socialPage`;
  }

  update(id: number, updateSocialPageDto: UpdateSocialPageDto) {
    return `This action updates a #${id} socialPage`;
  }

  remove(id: number) {
    return `This action removes a #${id} socialPage`;
  }
}
