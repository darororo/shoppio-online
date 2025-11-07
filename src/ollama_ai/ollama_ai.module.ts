import { DynamicModule, Module, Provider } from '@nestjs/common';
import { OllamaAiService } from './ollama_ai.service';
import { OllamaAiController } from './ollama_ai.controller';
import { OLLAMA_SERVICE } from './ollama_ai.constants';

export interface OllamaAiOptions {
  host: string;
  model: string;
  apiKey: string;
  systemPrompt: string;
}

@Module({
  // controllers: [OllamaAiController],
  // providers: [OllamaAiService],
  // exports: [OllamaAiService]
})
export class OllamaAiModule {

  static register(options: OllamaAiOptions): DynamicModule {
    const ollama = new OllamaAiService(options);

    const ollamaProvider: Provider = {
      provide: OLLAMA_SERVICE,
      useValue: ollama
    }


    return {
      module: OllamaAiModule,
      providers: [
        ollamaProvider
      ],
      exports: [ollamaProvider],
      global: true
    };
  }

}
