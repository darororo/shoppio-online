import { Injectable } from '@nestjs/common';
import { CreateAnalyzedMessageDto } from './dto/create-analyzed_message.dto';
import { UpdateAnalyzedMessageDto } from './dto/update-analyzed_message.dto';

@Injectable()
export class AnalyzedMessagesService {
  create(createAnalyzedMessageDto: CreateAnalyzedMessageDto) {
    return 'This action adds a new analyzedMessage';
  }

  findAll() {
    return `This action returns all analyzedMessages`;
  }

  findOne(id: number) {
    return `This action returns a #${id} analyzedMessage`;
  }

  update(id: number, updateAnalyzedMessageDto: UpdateAnalyzedMessageDto) {
    return `This action updates a #${id} analyzedMessage`;
  }

  remove(id: number) {
    return `This action removes a #${id} analyzedMessage`;
  }
}
