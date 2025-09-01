import { Test, TestingModule } from '@nestjs/testing';
import { PostDistributionsService } from './post_distributions.service';

describe('PostDistributionsService', () => {
  let service: PostDistributionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PostDistributionsService],
    }).compile();

    service = module.get<PostDistributionsService>(PostDistributionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
