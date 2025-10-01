import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAnalyzedMessageDto } from './dto/create-analyzed_message.dto';
import { UpdateAnalyzedMessageDto } from './dto/update-analyzed_message.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { AnalyzedMessage } from './entities/analyzed_message.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AnalyzedMessagesService {
  constructor(
    @InjectRepository(AnalyzedMessage)
    private analyzedRepo: Repository<AnalyzedMessage>,
  ) {}

  async create(createAnalyzedMessageDto: CreateAnalyzedMessageDto) {
    const newData = this.analyzedRepo.create(createAnalyzedMessageDto);

    const saveData = await this.analyzedRepo.save(newData);

    return saveData;
  }

  async findAll(): Promise<AnalyzedMessage[]> {
    const newData = this.analyzedRepo.find();

    if (!newData) {
      throw new NotFoundException(`The list is empty`);
    }

    return newData;
  }

  async findOne(id: string) {
    const newData = await this.analyzedRepo.findOne({
      where: { id },
      relations: ['buyer', 'analyzed_message'],
    });

    if (!newData) {
      throw new NotFoundException(`Analyzed Data with ID ${id} not found`);
    }
    return newData;
  }

  async findByMessageId(messageId: string) {
    const newData = await this.analyzedRepo.find({
      where: { message: { id: messageId } },
      relations: ['message'],
    });

    return newData;
  }

  async update(
    id: string,
    updateAnalyzedMessageDto: UpdateAnalyzedMessageDto,
  ): Promise<AnalyzedMessage> {
    const newData = await this.analyzedRepo.findOne({ where: { id } });

    if (!newData) {
      throw new NotFoundException(`Analyzed Data with ID ${id} not found`);
    }

    Object.assign(newData, updateAnalyzedMessageDto);
    return await this.analyzedRepo.save(newData);
  }

  remove(id: number) {
    return `This action removes a #${id} analyzedMessage`;
  }
}
