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

  /**
   * Get buyers with their Facebook conversations and profiles
   * This method integrates with Facebook API to get real conversation data
   */
  async getBuyersWithInteractions(pageId?: string) {
    try {
      console.log('🔄 Fetching buyers with Facebook interactions...');
      
      // Get buyers from database
      const buyers = await this.buyerRepo.find({
        relations: ['socialMessages'],
        order: { create_at: 'DESC' }
      });

      console.log(`📊 Found ${buyers.length} buyers in database`);

      // Transform database buyers to match expected format
      const processedBuyers = buyers.map(buyer => ({
        id: buyer.id,
        facebook_user_id: buyer.facebook_user_id,
        name: buyer.name,
        profile_pic: buyer.profile_pic,
        
        // Raw data from social messages
        rawData: buyer.socialMessages?.map(msg => ({
          message: msg.message_text || '',
          sender_name: msg.sender_name,
          sender_id: msg.sender_id,
          timestamp: msg.created_at,
          page_id: msg.socialPage?.id
        })) || [],
        
        // Processed fields
        full_name: buyer.name,
        username: buyer.name?.toLowerCase().replace(/\s+/g, '_'),
        phone_number: '', // Note: phone not in buyer entity yet
        location: '', // Note: location not in buyer entity yet
        created_at: buyer.create_at,
        
        // Mock analyzed data for now (in real app, this would come from AI analysis)
        analyzedData: [{
          extracted_product: '',
          extracted_name: buyer.name,
          extracted_location: '',
          extracted_phone: '',
          analysis_summary: 'Customer inquiry about products',
          buyer_intent: 'asking',
          confidence: 0.75
        }]
      }));

      return processedBuyers;

    } catch (error) {
      console.error('❌ Error fetching buyers with interactions:', error);
      throw new HttpException(
        `Failed to fetch buyers with interactions: ${error.message}`,
        500
      );
    }
  }
}
