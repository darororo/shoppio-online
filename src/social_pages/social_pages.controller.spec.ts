import { Test, TestingModule } from '@nestjs/testing';
import { SocialPagesController } from './social_pages.controller';
import { SocialPagesService } from './social_pages.service';

describe('SocialPagesController', () => {
  let controller: SocialPagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialPagesController],
      providers: [SocialPagesService],
    }).compile();

    controller = module.get<SocialPagesController>(SocialPagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
