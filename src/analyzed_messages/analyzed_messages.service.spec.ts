import { Test, TestingModule } from '@nestjs/testing';
import { AnalyzedMessagesService } from './analyzed_messages.service';

describe('AnalyzedMessagesService', () => {
  let service: AnalyzedMessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyzedMessagesService],
    }).compile();

    service = module.get<AnalyzedMessagesService>(AnalyzedMessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
