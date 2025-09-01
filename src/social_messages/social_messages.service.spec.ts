import { Test, TestingModule } from '@nestjs/testing';
import { SocialMessagesService } from './social_messages.service';

describe('SocialMessagesService', () => {
  let service: SocialMessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SocialMessagesService],
    }).compile();

    service = module.get<SocialMessagesService>(SocialMessagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
