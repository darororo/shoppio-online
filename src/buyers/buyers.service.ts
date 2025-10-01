import { HttpException, Injectable } from '@nestjs/common';
import { CreateBuyerDto } from './dto/create-buyer.dto';
import { UpdateBuyerDto } from './dto/update-buyer.dto';
import { Buyer } from './entities/buyer.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class BuyersService {
  constructor(
    @InjectRepository(Buyer)
    private buyerRepo: Repository<Buyer>,
  ) {}
  async create(createBuyerDto: CreateBuyerDto) {
    const buyer = await this.buyerRepo.create(createBuyerDto);

    return this.buyerRepo.save(buyer);
  }

  async findAll() {
    const buyers = await this.buyerRepo.find();

    if (!buyers) {
      throw new HttpException('Buyer list is empty', 404);
    }

    return buyers;
  }

  findOne(id: number) {
    return `This action returns a #${id} buyer`;
  }

  async update(
    facebook_user_id: string,
    updateBuyerDto: UpdateBuyerDto,
  ): Promise<Buyer> {
    const buyer = await this.buyerRepo.findOne({ where: { facebook_user_id } });

    if (!buyer) {
      throw new HttpException('Buyer with ${facebook_user_id} not found', 404);
    }

    Object.assign(buyer, updateBuyerDto);

    return this.buyerRepo.save(buyer);
  }

  remove(id: number) {
    return `This action removes a #${id} buyer`;
  }
}
