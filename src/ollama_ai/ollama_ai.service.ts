import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Ollama, Message as OllamaMessage } from 'ollama'

@Injectable()
export class OllamaAiService {
  private readonly llmService: Ollama
  private readonly safetyService: Ollama
  private readonly safetyModel: string
  private readonly llmModel: string
  private readonly systemPrompt: string

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.systemPrompt = this.configService.getOrThrow<string>('OLLAMA_SYSTEM_PROMPT')
    this.llmModel = this.configService.getOrThrow<string>('OLLAMA_MODEL_LLM')
    this.safetyModel = this.configService.getOrThrow<string>('OLLAMA_MODEL_VALIDATOR')

    const host = this.configService.getOrThrow<string>('OLLAMA_HOST')
    const apiKey = this.configService.getOrThrow<string>('OLLAMA_API_KEY')
    this.llmService = new Ollama({
      host,
      headers: {
        'X-API-KEY': apiKey,
      },
    })

    this.safetyService = new Ollama({
      host,
      headers: {
        'X-API-KEY': apiKey,
      },
    })
  }

  create() {
    return 'This action adds a new ollamaAi'
  }

  async sendPrompt(prompt: string) {
    const system = { role: 'system', content: this.systemPrompt }
    const message = { role: 'user', content: prompt }
    const response = await this.llmService.chat({
      model: this.llmModel,
      messages: [system, message],
      think: false,
      stream: false,
    })

    const content = response.message.content

    console.log(response)

    return content
  }

  async sendPromptWithContext(messages: OllamaMessage[]) {
    const system = { role: 'system', content: this.systemPrompt }

    const response = await this.llmService.chat({
      model: this.llmModel,
      messages: [system, ...messages],
      think: false,
      stream: false,
    })

    // const safety = await this.safetyService.chat({
    //   model: this.safetyModel,
    //   messages: [system, response]
    // })

    const content = response.message.content

    console.log(response)

    return content
  }

  findAll() {
    return `This action returns all ollamaAi`
  }

  findOne(id: number) {
    return `This action returns a #${id} ollamaAi`
  }

  update(id: number) {
    return `This action updates a #${id} ollamaAi`
  }

  remove(id: number) {
    return `This action removes a #${id} ollamaAi`
  }
}
