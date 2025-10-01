import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { AnalyzedMessagesService } from './analyzed_messages.service';
import { CreateAnalyzedMessageDto } from './dto/create-analyzed_message.dto';
import { UpdateAnalyzedMessageDto } from './dto/update-analyzed_message.dto';
import { AnalyzedMessage } from './entities/analyzed_message.entity';

@Controller('analyzed-messages')
export class AnalyzedMessagesController {
  constructor(
    private readonly analyzedMessagesService: AnalyzedMessagesService,
  ) {}

  @Post()
  async create(
    @Body() createAnalyzedMessageDto: CreateAnalyzedMessageDto,
  ): Promise<AnalyzedMessage> {
    return await this.analyzedMessagesService.create(createAnalyzedMessageDto);
  }

  @Get()
  async findAll(): Promise<AnalyzedMessage[]> {
    return await this.analyzedMessagesService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: string,
  ): Promise<AnalyzedMessage> {
    const data = await this.analyzedMessagesService.findOne(id);

    if (!data) {
      throw new NotFoundException(`Analyzed Message with ID ${id} not found`);
    }

    return data;
  }

  @Get('message/:messageId')
  async findByMessageId(
    @Param('messageId') messageId: string,
  ): Promise<AnalyzedMessage[]> {
    return this.analyzedMessagesService.findByMessageId(messageId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAnalyzedMessageDto: UpdateAnalyzedMessageDto,
  ): Promise<AnalyzedMessage> {
    return this.analyzedMessagesService.update(
      String(id),
      updateAnalyzedMessageDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.analyzedMessagesService.remove(+id);
  }
}
