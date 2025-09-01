import { Injectable } from '@nestjs/common';
import { CreateSocialMessageDto } from './dto/create-social_message.dto';
import { UpdateSocialMessageDto } from './dto/update-social_message.dto';

@Injectable()
export class SocialMessagesService {
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
}
