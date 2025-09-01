import { Injectable } from '@nestjs/common';
import { CreatePostDistributionDto } from './dto/create-post_distribution.dto';
import { UpdatePostDistributionDto } from './dto/update-post_distribution.dto';

@Injectable()
export class PostDistributionsService {
  create(createPostDistributionDto: CreatePostDistributionDto) {
    return 'This action adds a new postDistribution';
  }

  findAll() {
    return `This action returns all postDistributions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} postDistribution`;
  }

  update(id: number, updatePostDistributionDto: UpdatePostDistributionDto) {
    return `This action updates a #${id} postDistribution`;
  }

  remove(id: number) {
    return `This action removes a #${id} postDistribution`;
  }
}
