import { Test, TestingModule } from '@nestjs/testing';
import { PostDistributionsController } from './post_distributions.controller';
import { PostDistributionsService } from './post_distributions.service';

describe('PostDistributionsController', () => {
  let controller: PostDistributionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostDistributionsController],
      providers: [PostDistributionsService],
    }).compile();

    controller = module.get<PostDistributionsController>(PostDistributionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
