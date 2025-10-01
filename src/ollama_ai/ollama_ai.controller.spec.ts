import { Test, TestingModule } from '@nestjs/testing';
import { OllamaAiController } from './ollama_ai.controller';
import { OllamaAiService } from './ollama_ai.service';

describe('OllamaAiController', () => {
  let controller: OllamaAiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OllamaAiController],
      providers: [OllamaAiService],
    }).compile();

    controller = module.get<OllamaAiController>(OllamaAiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
