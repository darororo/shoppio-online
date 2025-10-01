import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OllamaAiService } from './ollama_ai.service';

@Controller('ollama-ai')
export class OllamaAiController {
  constructor(private readonly ollamaAiService: OllamaAiService) { }

  @Post()
  create() {
    return this.ollamaAiService.create();
  }

  @Get()
  findAll() {
    return this.ollamaAiService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ollamaAiService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.ollamaAiService.update(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ollamaAiService.remove(+id);
  }
}
