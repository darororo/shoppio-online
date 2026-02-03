import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { OllamaAiService } from './ollama_ai.service'

@Module({
  imports: [ConfigModule],
  providers: [OllamaAiService],
  exports: [OllamaAiService],
})
export class OllamaAiModule {}
