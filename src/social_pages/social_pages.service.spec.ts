import { Test, TestingModule } from '@nestjs/testing';
import { SocialPagesService } from './social_pages.service';

describe('SocialPagesService', () => {
  let service: SocialPagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SocialPagesService],
    }).compile();

    service = module.get<SocialPagesService>(SocialPagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
