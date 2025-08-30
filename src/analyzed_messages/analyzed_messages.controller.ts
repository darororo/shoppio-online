import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AnalyzedMessagesService } from './analyzed_messages.service';
import { CreateAnalyzedMessageDto } from './dto/create-analyzed_message.dto';
import { UpdateAnalyzedMessageDto } from './dto/update-analyzed_message.dto';

@Controller('analyzed-messages')
export class AnalyzedMessagesController {
  constructor(private readonly analyzedMessagesService: AnalyzedMessagesService) {}

  @Post()
  create(@Body() createAnalyzedMessageDto: CreateAnalyzedMessageDto) {
    return this.analyzedMessagesService.create(createAnalyzedMessageDto);
  }

  @Get()
  findAll() {
    return this.analyzedMessagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.analyzedMessagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAnalyzedMessageDto: UpdateAnalyzedMessageDto) {
    return this.analyzedMessagesService.update(+id, updateAnalyzedMessageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.analyzedMessagesService.remove(+id);
  }
}
