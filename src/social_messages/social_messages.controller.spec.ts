import { Test, TestingModule } from '@nestjs/testing';
import { SocialMessagesController } from './social_messages.controller';
import { SocialMessagesService } from './social_messages.service';

describe('SocialMessagesController', () => {
  let controller: SocialMessagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SocialMessagesController],
      providers: [SocialMessagesService],
    }).compile();

    controller = module.get<SocialMessagesController>(SocialMessagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
