import { HttpException, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const newOrder = this.orderRepo.create(createOrderDto);

    return await this.orderRepo.save(newOrder);
  }

  async findAll() {
    const orders = this.orderRepo.find();

    if (!orders) {
      throw new HttpException('This list is empty', 404);
    }

    return orders;
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({ where: { id } });

    if (!order) {
      throw new HttpException('Order with ID ${id} is not found', 404);
    }
    return order;
  }

  async findByBuyerId(buyerId: string) {
    const orders = await this.orderRepo.find({ where: { buyId: buyerId } });

    if (!orders) {
      throw new HttpException('Order with buyerID ${id} is not found', 404);
    }

    return orders;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.orderRepo.findOne({ where: { id } });

    if (!order) {
      throw new HttpException('Order with ID ${id} is not found', 404);
    }

    Object.assign(order, updateOrderDto);

    return await this.orderRepo.save(order);
  }

  async remove(id: string) {
    const order = await this.orderRepo.findOne({ where: { id } });

    if (!order) {
      throw new HttpException('Order with ID ${id} is not found', 404);
    }

    return await this.orderRepo.remove(order);
  }
}
