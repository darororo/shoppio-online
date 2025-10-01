import { Injectable } from '@nestjs/common';
import { Ollama } from 'ollama'
import { OllamaAiOptions } from './ollama_ai.module';
@Injectable()
export class OllamaAiService {
  private readonly ollama: Ollama;

  constructor(private readonly options: OllamaAiOptions) {
    this.ollama = new Ollama({
      host: options.host,
      headers: {
        'X-API-KEY': options.apiKey,
      },
    })
  }


  create() {
    return 'This action adds a new ollamaAi';
  }

  async sendPrompt(prompt: string) {
    const message = { role: 'user', content: prompt }
    const response = await this.ollama.chat({
      model: this.options.model,
      messages: [message],
    })

    const content = response.message.content

    console.log(response);

    return content;
  }

  findAll() {
    return `This action returns all ollamaAi`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ollamaAi`;
  }

  update(id: number) {
    return `This action updates a #${id} ollamaAi`;
  }

  remove(id: number) {
    return `This action removes a #${id} ollamaAi`;
  }
}
