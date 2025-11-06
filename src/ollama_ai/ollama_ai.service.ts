import { Injectable } from '@nestjs/common';
import { Message as OllamaMessage, Ollama } from 'ollama'
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
    const system = { role: 'system', content: "You are a helpful shop assistant who sells music related stuff. Please keep your response short and helpful. DO NOT response to anything not related to music." }
    const message = { role: 'user', content: prompt }
    const response = await this.ollama.chat({
      model: this.options.model,
      messages: [system, message],
      think: false,
      stream: false,
    })

    const content = response.message.content

    console.log(response);

    return content;
  }

  async sendPromptWithContext(messages: OllamaMessage[]) {
    const system = { role: 'system', content: "You are a helpful shop assistant who sells music related stuff. Please keep your response short and helpful. DO NOT response to anything not related to music." }

    const response = await this.ollama.chat({
      model: this.options.model,
      messages: [system, ...messages],
      think: false,
      stream: false,
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
