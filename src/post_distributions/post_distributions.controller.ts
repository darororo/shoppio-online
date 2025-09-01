import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PostDistributionsService } from './post_distributions.service';
import { CreatePostDistributionDto } from './dto/create-post_distribution.dto';
import { UpdatePostDistributionDto } from './dto/update-post_distribution.dto';

@Controller('post-distributions')
export class PostDistributionsController {
  constructor(private readonly postDistributionsService: PostDistributionsService) {}

  @Post()
  create(@Body() createPostDistributionDto: CreatePostDistributionDto) {
    return this.postDistributionsService.create(createPostDistributionDto);
  }

  @Get()
  findAll() {
    return this.postDistributionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postDistributionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePostDistributionDto: UpdatePostDistributionDto) {
    return this.postDistributionsService.update(+id, updatePostDistributionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.postDistributionsService.remove(+id);
  }
}
