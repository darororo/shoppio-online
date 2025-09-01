import { Injectable } from '@nestjs/common';
import { CreateSocialAccountDto } from './dto/create-social_account.dto';
import { UpdateSocialAccountDto } from './dto/update-social_account.dto';

@Injectable()
export class SocialAccountService {
  create(createSocialAccountDto: CreateSocialAccountDto) {
    return 'This action adds a new socialAccount';
  }

  findAll() {
    return `This action returns all socialAccount`;
  }

  findOne(id: number) {
    return `This action returns a #${id} socialAccount`;
  }

  update(id: number, updateSocialAccountDto: UpdateSocialAccountDto) {
    return `This action updates a #${id} socialAccount`;
  }

  remove(id: number) {
    return `This action removes a #${id} socialAccount`;
  }
}
