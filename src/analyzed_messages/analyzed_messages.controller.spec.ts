import { Test, TestingModule } from '@nestjs/testing';
import { AnalyzedMessagesController } from './analyzed_messages.controller';
import { AnalyzedMessagesService } from './analyzed_messages.service';

describe('AnalyzedMessagesController', () => {
  let controller: AnalyzedMessagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyzedMessagesController],
      providers: [AnalyzedMessagesService],
    }).compile();

    controller = module.get<AnalyzedMessagesController>(AnalyzedMessagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
